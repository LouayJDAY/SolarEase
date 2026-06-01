package com.solarease.repository;

import com.solarease.entity.ProductCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductCatalogRepository extends JpaRepository<ProductCatalog, Long> {

    List<ProductCatalog> findByCategory(ProductCatalog.Category category);

    @Query("SELECT p FROM ProductCatalog p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.reference) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<ProductCatalog> searchByNameOrReference(@Param("q") String query);

    @Query("SELECT p FROM ProductCatalog p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.reference) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<ProductCatalog> searchFiltered(
        @Param("category") ProductCatalog.Category category,
        @Param("q") String query
    );
}
