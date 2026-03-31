package com.solarease.repository;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByType(EquipmentType type);
}
