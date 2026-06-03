package com.solarease.service;

import com.solarease.dto.ProductCatalogDTO;
import com.solarease.entity.ProductCatalog;
import com.solarease.repository.ProductCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductCatalogService {

    private final ProductCatalogRepository repository;

    public List<ProductCatalogDTO> getAll() {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<ProductCatalogDTO> search(String q, String category) {
        ProductCatalog.Category cat = null;
        if (category != null && !category.isBlank()) {
            try {
                cat = ProductCatalog.Category.valueOf(category.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        String query = (q != null && !q.isBlank()) ? q.trim() : null;

        if (cat == null && query == null) {
            return getAll();
        }
        if (query == null) {
            return repository.findByCategory(cat).stream().map(this::toDTO).collect(Collectors.toList());
        }

        String pattern = "%" + query.toLowerCase() + "%";
        return repository.searchFiltered(cat, pattern).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public ProductCatalogDTO create(ProductCatalogDTO dto) {
        ProductCatalog entity = ProductCatalog.builder()
                .name(dto.getName())
                .reference(dto.getReference())
                .defaultPrice(dto.getDefaultPrice())
                .category(ProductCatalog.Category.valueOf(dto.getCategory()))
                .description(dto.getDescription())
                .build();
        return toDTO(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    private ProductCatalogDTO toDTO(ProductCatalog p) {
        return ProductCatalogDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .reference(p.getReference())
                .defaultPrice(p.getDefaultPrice())
                .category(p.getCategory().name())
                .description(p.getDescription())
                .build();
    }
}
