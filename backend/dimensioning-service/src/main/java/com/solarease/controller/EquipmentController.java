package com.solarease.controller;

import com.solarease.dto.EquipmentRequest;
import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;
import com.solarease.service.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    public List<Equipment> getAllEquipment() {
        return equipmentService.getAllEquipment();
    }

    @GetMapping("/type/{type}")
    public List<Equipment> getEquipmentByType(
            @PathVariable EquipmentType type,
            @RequestParam(required = false) PanelCategory category) {
        if (type == EquipmentType.SOLAR_PANEL && category != null) {
            return equipmentService.getSolarPanels(category);
        }
        return equipmentService.getEquipmentByType(type);
    }

    @GetMapping("/{id}")
    public Equipment getEquipmentById(@PathVariable Long id) {
        return equipmentService.getEquipmentById(id);
    }

    @PostMapping
    public ResponseEntity<Equipment> createEquipment(@RequestBody @Valid EquipmentRequest request) {
        Equipment created = equipmentService.createEquipment(request);
        return ResponseEntity.created(URI.create("/api/equipment/" + created.getId())).body(created);
    }

    @PutMapping("/{id}")
    public Equipment updateEquipment(@PathVariable Long id, @RequestBody @Valid EquipmentRequest request) {
        return equipmentService.updateEquipment(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
    }
}
