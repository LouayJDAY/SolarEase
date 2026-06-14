package com.solarease.debug;

import lombok.extern.slf4j.Slf4j;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Map;

@Slf4j
public final class DebugTrace {

    private static final String LOG_PATH = "/home/louay/Desktop/louay/Parnass/.cursor/debug-34125a.log";

    private DebugTrace() {}

    public static void log(String hypothesisId, String location, String message, Map<String, Object> data) {
        long ts = System.currentTimeMillis();
        String dataJson = data == null || data.isEmpty() ? "{}" : mapToJson(data);
        String line = "{\"sessionId\":\"34125a\",\"hypothesisId\":\"" + hypothesisId
                + "\",\"location\":\"" + escape(location)
                + "\",\"message\":\"" + escape(message)
                + "\",\"data\":" + dataJson + ",\"timestamp\":" + ts + "}\n";
        // #region agent log
        try {
            Files.writeString(Path.of(LOG_PATH), line, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception ignored) {
        }
        log.info("[debug-34125a {}] {} {} {}", hypothesisId, location, message, dataJson);
        // #endregion
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String mapToJson(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : data.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(escape(e.getKey())).append("\":");
            Object v = e.getValue();
            if (v == null) sb.append("null");
            else if (v instanceof Boolean || v instanceof Number) sb.append(v);
            else sb.append("\"").append(escape(String.valueOf(v))).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }
}
