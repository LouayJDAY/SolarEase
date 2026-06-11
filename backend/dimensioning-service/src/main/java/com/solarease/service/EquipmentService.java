package com.solarease.service;

import com.solarease.dto.EquipmentRequest;
import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;
import com.solarease.repository.EquipmentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
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

    public List<Equipment> getSolarPanels(PanelCategory category) {
        if (category == null) {
            return equipmentRepository.findByType(EquipmentType.SOLAR_PANEL);
        }
        return equipmentRepository.findByTypeAndPanelCategory(EquipmentType.SOLAR_PANEL, category);
    }

    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Equipment not found with id: " + id));
    }

    /**
     * Picks the highest-power panel when the client did not specify a model.
     */
    public Equipment pickDefaultPanel(List<Equipment> panels) {
        if (panels == null || panels.isEmpty()) {
            return null;
        }
        return panels.stream()
                .max(Comparator.comparing(
                        Equipment::getNominalPower,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(panels.get(0));
    }

    @Transactional
    public Equipment createEquipment(EquipmentRequest request) {
        return equipmentRepository.save(fromRequest(request));
    }

    @Transactional
    public Equipment updateEquipment(Long id, EquipmentRequest request) {
        Equipment existing = getEquipmentById(id);
        applyRequest(existing, request);
        return equipmentRepository.save(existing);
    }

    private Equipment fromRequest(EquipmentRequest request) {
        Equipment equipment = new Equipment();
        applyRequest(equipment, request);
        return equipment;
    }

    private void applyRequest(Equipment equipment, EquipmentRequest request) {
        equipment.setName(request.getName());
        equipment.setBrand(request.getBrand());
        equipment.setModel(request.getModel());
        equipment.setType(request.getType());
        equipment.setPanelCategory(request.getPanelCategory());
        equipment.setNominalPower(request.getNominalPower());
        equipment.setEfficiency(request.getEfficiency());
        equipment.setArea(request.getArea());
        equipment.setStorageCapacityKwh(request.getStorageCapacityKwh());
        equipment.setPrice(request.getPrice());
        equipment.setWarrantyYears(request.getWarrantyYears());
        equipment.setSpecifications(request.getSpecifications());
        equipment.setImageUrl(request.getImageUrl());
    }

    @Transactional
    public Equipment createEquipmentLegacy(Equipment equipment) {
        return equipmentRepository.save(equipment);
    }

    @Transactional
    public Equipment updateEquipmentLegacy(Long id, Equipment updatedEquipment) {
        Equipment existing = getEquipmentById(id);
        existing.setName(updatedEquipment.getName());
        existing.setBrand(updatedEquipment.getBrand());
        existing.setModel(updatedEquipment.getModel());
        existing.setType(updatedEquipment.getType());
        existing.setPanelCategory(updatedEquipment.getPanelCategory());
        existing.setNominalPower(updatedEquipment.getNominalPower());
        existing.setEfficiency(updatedEquipment.getEfficiency());
        existing.setArea(updatedEquipment.getArea());
        existing.setStorageCapacityKwh(updatedEquipment.getStorageCapacityKwh());
        existing.setPrice(updatedEquipment.getPrice());
        existing.setWarrantyYears(updatedEquipment.getWarrantyYears());
        existing.setSpecifications(updatedEquipment.getSpecifications());
        existing.setImageUrl(updatedEquipment.getImageUrl());
        return equipmentRepository.save(existing);
    }

    @Transactional
    public void deleteEquipment(Long id) {
        equipmentRepository.deleteById(id);
    }
}
