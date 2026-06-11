package com.solarease.repository;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import org.springframework.data.jpa.repository.JpaRepository;

import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByType(EquipmentType type);

    List<Equipment> findByTypeAndPanelCategory(EquipmentType type, PanelCategory panelCategory);

    long countByType(EquipmentType type);

    Optional<Equipment> findByModel(String model);
}
