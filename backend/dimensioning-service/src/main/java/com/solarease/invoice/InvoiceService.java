package com.solarease.invoice;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.color.ColorSpace;
import java.awt.image.BufferedImage;
import java.awt.image.ColorConvertOp;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class InvoiceService {

    public InvoiceDTO parseInvoice(MultipartFile file) throws Exception {
        File uploaded = Files.createTempFile("invoice-upload-", getTempExtension(file)).toFile();
        try (InputStream in = file.getInputStream(); FileOutputStream out = new FileOutputStream(uploaded)) {
            byte[] buf = new byte[8192];
            int r;
            while ((r = in.read(buf)) != -1) out.write(buf, 0, r);
        }

        File preprocessed = preprocessImage(uploaded);
        File bottomCrop = createCrop(preprocessed, 0.0, 0.45, 1.0, 0.55);
        File bottomRightCrop = createCrop(preprocessed, 0.35, 0.45, 0.65, 0.55);
        String ocr = runTesseractMerged(preprocessed, bottomCrop, bottomRightCrop);

        InvoiceDTO dto = new InvoiceDTO();
        dto.confidences = new HashMap<>();

        // naive extraction: invoice number
        String invoiceNumber = firstNonNull(
                findRegex(ocr, "(?i)(?:invoice|facture|fact|bill)\\s*(?:n[o°º.]?|number|num(?:ero)?|#)?\\s*[:#-]?\\s*([A-Z0-9][A-Z0-9\\-_/]{2,})"),
                findRegex(ocr, "(?i)(?:n[o°º.]?|num(?:ero)?|invoice no|facture no)\\s*[:#-]?\\s*([A-Z0-9][A-Z0-9\\-_/]{2,})")
        );
        dto.invoiceNumber = invoiceNumber;
        dto.confidences.put("invoiceNumber", invoiceNumber != null ? 0.85 : 0.0);

        // date
        String date = firstNonNull(
                findRegex(ocr, "(?i)(?:date|dated|le)\\s*[:#-]?\\s*(\\d{1,2}[-/\\.]\\d{1,2}[-/\\.]\\d{2,4})"),
                findRegex(ocr, "(\\d{1,2}[-/\\.]\\d{1,2}[-/\\.]\\d{2,4})"),
                findRegex(ocr, "(?i)(\\d{1,2}\\s+[a-zéûîô]+\\s+\\d{2,4})")
        );
        dto.date = date;
        dto.confidences.put("date", date != null ? 0.82 : 0.0);

        // total (attempt to find 'total' line) - prioritize electricity over gas
        String totalLine = firstNonNull(
                findElectricityTotal(ocr),
                findRegex(ocr, "(?i)(?:total\\s*ttc|ttc|montant\\s*ttc|total\\s*\\(?ttc\\)?)[^\\d]*([0-9]{1,3}(?:[ .]?[0-9]{3})*(?:[.,][0-9]{2}))"),
                findRegex(ocr, "(?i)(?:amount\\s*due|grand\\s*total|net\\s*amount|total\\s*due)[^\\d]*([0-9]{1,3}(?:[ .]?[0-9]{3})*(?:[.,][0-9]{2}))")
        );
        if (totalLine == null) {
            // fallback: largest amount-like number in document
            totalLine = findLargestAmountToken(ocr);
        }
        BigDecimal total = parseAmount(totalLine);
        dto.totalTTC = total;
        dto.confidences.put("totalTTC", total != null ? 0.78 : 0.0);

        String currency = firstNonNull(
                findRegex(ocr, "(?i)\\b(TND|DT|EUR|USD|MAD|GBP)\\b"),
                findRegex(ocr, "(?i)dinar\\s*tunisien")
        );
        dto.currency = currency;
        dto.confidences.put("currency", currency != null ? 0.7 : 0.0);

        // supplier name: best candidate among top lines, avoiding footer / totals / metadata
        String supplier = findSupplierName(ocr);
        dto.supplierName = supplier;
        dto.confidences.put("supplierName", supplier != null ? 0.72 : 0.0);

        dto.supplierAddress = findSupplierAddress(ocr, supplier);
        dto.confidences.put("supplierAddress", dto.supplierAddress != null ? 0.55 : 0.0);

        // no structured lines in prototype
        dto.lines = new ArrayList<>();

        // cleanup temp file
        safeDelete(preprocessed);
        safeDelete(uploaded);
        return dto;
    }

    private String getTempExtension(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null) {
            return ".png";
        }
        int idx = name.lastIndexOf('.');
        if (idx >= 0 && idx < name.length() - 1) {
            return name.substring(idx);
        }
        return ".png";
    }

    private File preprocessImage(File source) {
        try {
            BufferedImage input = ImageIO.read(source);
            if (input == null) {
                return source;
            }

            int targetWidth = Math.max(input.getWidth() * 2, 1600);
            int targetHeight = Math.max(input.getHeight() * 2, 1200);

            BufferedImage scaled = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = scaled.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.drawImage(input, 0, 0, targetWidth, targetHeight, null);
            g.dispose();

            BufferedImage gray = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_BYTE_GRAY);
            new ColorConvertOp(ColorSpace.getInstance(ColorSpace.CS_GRAY), null).filter(scaled, gray);

            BufferedImage thresholded = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_BYTE_GRAY);
            for (int y = 0; y < targetHeight; y++) {
                for (int x = 0; x < targetWidth; x++) {
                    int value = gray.getRaster().getSample(x, y, 0);
                    int binary = value < 180 ? 0 : 255;
                    thresholded.getRaster().setSample(x, y, 0, binary);
                }
            }

            File output = Files.createTempFile("invoice-preprocessed-", ".png").toFile();
            ImageIO.write(thresholded, "png", output);
            return output;
        } catch (IOException e) {
            return source;
        }
    }

    private String runTesseractMerged(File... files) {
        String[] psms = {"6", "4", "11", "3"};
        String bestText = "";
        int bestScore = Integer.MIN_VALUE;
        List<String> collectedTexts = new ArrayList<>();

        for (File file : files) {
            if (file == null) continue;
            for (String psm : psms) {
                String text = runTesseract(file, psm);
                if (text != null && !text.isBlank()) {
                    collectedTexts.add(text);
                }
                int score = scoreOcrText(text);
                if (score > bestScore) {
                    bestScore = score;
                    bestText = text;
                }
            }
        }

        if (collectedTexts.isEmpty()) {
            return bestText;
        }

        StringBuilder merged = new StringBuilder(bestText == null ? "" : bestText.trim());
        for (String text : collectedTexts) {
            for (String line : text.split("\\r?\\n")) {
                String normalized = line.trim().replaceAll("\\s+", " ");
                if (normalized.isBlank()) continue;
                if (merged.indexOf(normalized) < 0) {
                    if (merged.length() > 0) {
                        merged.append('\n');
                    }
                    merged.append(normalized);
                }
            }
        }
        return merged.toString();
    }

    private File createCrop(File source, double xRatio, double yRatio, double wRatio, double hRatio) {
        try {
            BufferedImage input = ImageIO.read(source);
            if (input == null) {
                return source;
            }

            int x = (int) Math.round(input.getWidth() * xRatio);
            int y = (int) Math.round(input.getHeight() * yRatio);
            int width = Math.max(1, (int) Math.round(input.getWidth() * wRatio));
            int height = Math.max(1, (int) Math.round(input.getHeight() * hRatio));

            x = Math.min(Math.max(0, x), Math.max(0, input.getWidth() - 1));
            y = Math.min(Math.max(0, y), Math.max(0, input.getHeight() - 1));
            width = Math.min(width, input.getWidth() - x);
            height = Math.min(height, input.getHeight() - y);

            BufferedImage crop = input.getSubimage(x, y, width, height);
            File output = Files.createTempFile("invoice-crop-", ".png").toFile();
            ImageIO.write(crop, "png", output);
            return output;
        } catch (IOException e) {
            return source;
        }
    }

    private String runTesseract(File f, String psm) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "tesseract",
                    f.getAbsolutePath(),
                    "stdout",
                    "-l", "fra+eng",
                    "--psm", psm,
                    "--oem", "1"
            );
            pb.redirectErrorStream(true);
            Process p = pb.start();
            Scanner s = new Scanner(p.getInputStream()).useDelimiter("\\A");
            String out = s.hasNext() ? s.next() : "";
            p.waitFor();
            return out;
        } catch (Exception e) {
            return "";
        }
    }

    private int scoreOcrText(String text) {
        if (text == null || text.isBlank()) {
            return Integer.MIN_VALUE / 2;
        }
        int score = 0;
        String lower = text.toLowerCase();
        score += Math.min(text.length() / 8, 50);
        if (lower.contains("facture")) score += 25;
        if (lower.contains("invoice")) score += 20;
        if (lower.contains("total")) score += 15;
        if (lower.contains("ttc")) score += 15;
        if (lower.contains("date")) score += 10;
        if (lower.contains("tnd") || lower.contains("dt") || lower.contains("eur") || lower.contains("usd")) score += 8;
        score -= countOccurrences(text, "Estimating resolution as");
        score -= countOccurrences(text, "Empty page!!");
        return score;
    }

    private int countOccurrences(String text, String needle) {
        if (text == null || needle == null || needle.isEmpty()) return 0;
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(needle, index)) >= 0) {
            count++;
            index += needle.length();
        }
        return count;
    }

    private String findRegex(String text, String regex) {
        if (text == null) return null;
        Pattern p = Pattern.compile(regex, Pattern.MULTILINE);
        Matcher m = p.matcher(text);
        if (m.find()) {
            for (int i = 1; i <= m.groupCount(); i++) {
                String g = m.group(i);
                if (g != null && g.trim().length() > 0) return g.trim();
            }
            return m.group(0).trim();
        }
        return null;
    }

    private String findFirstNonEmptyLine(String text) {
        if (text == null) return null;
        for (String line : text.split("\\r?\\n")) {
            String t = line.trim();
            if (!t.isEmpty() && t.length() > 3) return t;
        }
        return null;
    }

    private String findSupplierName(String text) {
        if (text == null) return null;
        String best = null;
        int bestScore = Integer.MIN_VALUE;
        int lineIndex = 0;
        for (String rawLine : text.split("\\r?\\n")) {
            String line = rawLine.trim().replaceAll("\\s+", " ");
            if (line.isBlank()) {
                lineIndex++;
                continue;
            }
            String lower = line.toLowerCase();
            if (lower.contains("facture") || lower.contains("invoice") || lower.contains("total") || lower.contains("ttc") || lower.contains("tva") || lower.contains("date") || lower.contains("page") || lower.contains("estimating resolution")) {
                lineIndex++;
                continue;
            }

            int letters = countLetters(line);
            int digits = countDigits(line);
            int score = letters * 2 - digits * 2;
            if (lineIndex <= 5) {
                score += 6;
            }
            if (line.length() > 6 && line.length() < 80) {
                score += 3;
            }
            if (line.equals(line.toUpperCase()) && line.length() > 4) {
                score += 1;
            }
            if (score > bestScore) {
                bestScore = score;
                best = line;
            }
            lineIndex++;
        }

        return best;
    }

    private String findSupplierAddress(String text, String supplierName) {
        if (text == null || supplierName == null) return null;
        String[] lines = text.split("\\r?\\n");
        for (int i = 0; i < lines.length; i++) {
            String current = lines[i].trim().replaceAll("\\s+", " ");
            if (current.equalsIgnoreCase(supplierName)) {
                StringBuilder address = new StringBuilder();
                for (int j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                    String next = lines[j].trim().replaceAll("\\s+", " ");
                    if (next.isBlank()) continue;
                    if (next.toLowerCase().contains("total") || next.toLowerCase().contains("facture") || next.toLowerCase().contains("invoice")) {
                        break;
                    }
                    if (address.length() > 0) address.append(" ");
                    address.append(next);
                }
                return address.length() > 0 ? address.toString() : null;
            }
        }
        return null;
    }

    private int countLetters(String text) {
        int count = 0;
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) count++;
        }
        return count;
    }

    private int countDigits(String text) {
        int count = 0;
        for (char c : text.toCharArray()) {
            if (Character.isDigit(c)) count++;
        }
        return count;
    }

    private String firstNonNull(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private void safeDelete(File file) {
        if (file != null && file.exists()) {
            file.delete();
        }
    }

    private BigDecimal parseAmount(String s) {
        if (s == null) return null;
        try {
            String cleaned = s.replaceAll("[^0-9,.-]", "").replace(" ", "");
            if (cleaned.contains(",") && cleaned.contains(".")) {
                if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                    cleaned = cleaned.replace(".", "").replace(',', '.');
                } else {
                    cleaned = cleaned.replace(",", "");
                }
            } else {
                cleaned = cleaned.replace(',', '.');
            }
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            return null;
        }
    }

    private String findLargestAmountToken(String text) {
        if (text == null) return null;
        Pattern p = Pattern.compile("([0-9]{1,3}(?:[ .]?[0-9]{3})*(?:[.,][0-9]{2}))");
        Matcher m = p.matcher(text);
        BigDecimal max = null;
        String best = null;
        while (m.find()) {
            String token = m.group(1);
            BigDecimal amount = parseAmount(token);
            if (amount != null && (max == null || amount.compareTo(max) > 0)) {
                max = amount;
                best = token;
            }
        }
        return best;
    }

    /**
     * Tries to extract electricity-specific total to avoid confusing with gas charges.
     * Searches for patterns like "Total électricité", "Montant à payer - électricité", etc.
     */
    private String findElectricityTotal(String text) {
        if (text == null) return null;
        
        String[] patterns = {
                "(?i)(?:total|montant)\\s*(?:à\\s*payer)?\\s*[-–]?\\s*électricité[^\\d]*([0-9]{1,3}(?:[ .]?[0-9]{3})*(?:[.,][0-9]{2}))",
                "(?i)électricité[^\\d]*(?:total|montant)[^\\d]*([0-9]{1,3}(?:[ .]?[0-9]{3})*(?:[.,][0-9]{2}))",
                "(?i)montant\\s+(?:à\\s+payer\\s+)?électricité[^\\d]*([0-9]{1,3}(?:[ .]?[0-9]{3})*(?:[.,][0-9]{2}))",
                "(?i)electricity[^\\d]*(?:total|amount)[^\\d]*([0-9]{1,3}(?:[ .]?[0-9]{3})*(?:[.,][0-9]{2}))",
        };
        
        for (String pattern : patterns) {
            String result = findRegex(text, pattern);
            if (result != null) return result;
        }
        return null;
    }
}
