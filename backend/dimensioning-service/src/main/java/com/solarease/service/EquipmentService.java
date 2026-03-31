package com.solarease.service;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.repository.EquipmentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    public List<Equipment> getEquipmentByType(EquipmentType type) {
        return equipmentRepository.findByType(type);
    }

    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Equipment not found with id: " + id));
    }

    @Transactional
    public Equipment createEquipment(Equipment equipment) {
        return equipmentRepository.save(equipment);
    }

    @Transactional
    public Equipment updateEquipment(Long id, Equipment updatedEquipment) {
        Equipment existing = getEquipmentById(id);
        existing.setName(updatedEquipment.getName());
        existing.setBrand(updatedEquipment.getBrand());
        existing.setModel(updatedEquipment.getModel());
        existing.setType(updatedEquipment.getType());
        existing.setNominalPower(updatedEquipment.getNominalPower());
        existing.setPrice(updatedEquipment.getPrice());
        // Update other fields as needed
        return equipmentRepository.save(existing);
    }

    @Transactional
    public void deleteEquipment(Long id) {
        equipmentRepository.deleteById(id);
    }
}
