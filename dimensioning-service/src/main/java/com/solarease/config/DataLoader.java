package com.solarease.config;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final EquipmentRepository equipmentRepository;

    @Override
    public void run(String... args) throws Exception {
        if (equipmentRepository.count() == 0) {
            // Default Panels
            equipmentRepository.save(Equipment.builder()
                    .name("SunPower Maxeon 3")
                    .brand("SunPower")
                    .model("SPR-MAX3-400")
                    .type(EquipmentType.SOLAR_PANEL)
                    .nominalPower(400.0)
                    .efficiency(0.226)
                    .area(1.69)
                    .price(BigDecimal.valueOf(450.0))
                    .warrantyYears(25)
                    .build());

            equipmentRepository.save(Equipment.builder()
                    .name("Jinko Solar Tiger Neo")
                    .brand("Jinko Solar")
                    .model("JKM565N-72HL4")
                    .type(EquipmentType.SOLAR_PANEL)
                    .nominalPower(565.0)
                    .efficiency(0.2187)
                    .area(2.27)
                    .price(BigDecimal.valueOf(550.0))
                    .warrantyYears(15)
                    .build());

            // Default Inverters
            equipmentRepository.save(Equipment.builder()
                    .name("Huawei SUN2000-5KTL")
                    .brand("Huawei")
                    .model("SUN2000-5KTL-L1")
                    .type(EquipmentType.INVERTER)
                    .nominalPower(5000.0)
                    .price(BigDecimal.valueOf(2200.0))
                    .warrantyYears(10)
                    .specifications("{\"phase\": \"Single-Phase\", \"mppt\": 2}")
                    .build());

            equipmentRepository.save(Equipment.builder()
                    .name("Fronius Symo 10.0-3-M")
                    .brand("Fronius")
                    .model("Symo 10.0-3-M")
                    .type(EquipmentType.INVERTER)
                    .nominalPower(10000.0)
                    .price(BigDecimal.valueOf(4500.0))
                    .warrantyYears(5)
                    .specifications("{\"phase\": \"Three-Phase\", \"mppt\": 2}")
                    .build());

            // ── Night Panels ──
            equipmentRepository.save(Equipment.builder()
                    .name("SolarNight SN-400 Hybrid")
                    .brand("SolarNight")
                    .model("SN-400-HB")
                    .type(EquipmentType.NIGHT_PANEL)
                    .nominalPower(400.0)
                    .efficiency(0.21)
                    .area(1.85)
                    .storageCapacityKwh(1.2) // 1.2 kWh storage intégré par panneau
                    .price(BigDecimal.valueOf(750.0))
                    .warrantyYears(20)
                    .specifications("{\"technology\": \"Monocrystalline + Integrated LFP Battery\", \"nightOutput\": \"1.2 kWh\", \"cycleLife\": 6000}")
                    .build());

            equipmentRepository.save(Equipment.builder()
                    .name("EcoNight EN-550 Pro")
                    .brand("EcoNight Energy")
                    .model("EN-550-PRO")
                    .type(EquipmentType.NIGHT_PANEL)
                    .nominalPower(550.0)
                    .efficiency(0.215)
                    .area(2.30)
                    .storageCapacityKwh(2.0) // 2.0 kWh storage intégré par panneau
                    .price(BigDecimal.valueOf(1100.0))
                    .warrantyYears(25)
                    .specifications("{\"technology\": \"HJT + Solid-State Battery\", \"nightOutput\": \"2.0 kWh\", \"cycleLife\": 8000}")
                    .build());
            
            System.out.println("Default Equipment Data Loaded.");
        }
    }
}
