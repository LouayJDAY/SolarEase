# Formules de dimensionnement SolarEase

Ce fichier regroupe les principales formules utilisées dans le service de dimensionnement, ainsi que les paramètres à valider avec la société pour améliorer la précision des projets.

## 1. Surface utile

$$\text{usableArea} = \text{roofArea} \times 0.7$$

- Le coefficient `0.7` représente la surface réellement exploitable.
- À valider : obstacles, ombrage, espacements, marges techniques.

## 2. Nombre de panneaux

$$\text{panelCount} = \left\lfloor \frac{\text{usableArea}}{\text{panelAreaM2}} \right\rfloor$$

- Dépend de la surface d’un panneau et de la surface utile.
- À valider : dimensions réelles du panneau, orientation de pose.

## 3. Puissance totale installée

$$\text{totalCapacityKw} = \frac{\text{panelCount} \times \text{panelPowerW}}{1000}$$

- `panelPowerW` est la puissance nominale d’un panneau en watts.
- À valider : puissance réelle fabricant, tolérances.

## 4. Production annuelle

### Avec PVGIS

$$\text{estimatedProduction} = \text{PVGIS}(lat, lon, peakpower, angle, aspect)$$

### Sans PVGIS

$$\text{estimatedProduction} = \text{totalCapacityKw} \times 1600 \times \text{orientationFactor} \times \text{inclinationFactor}$$

- À valider : productivité locale, pertes système, rendement onduleur.

## 5. Facteur d’orientation

- Sud = `1.0`
- Sud-Est / Sud-Ouest = `0.95`
- Est / Ouest = `0.85`
- Nord-Est / Nord-Ouest = `0.70`
- Nord = `0.60`

- À valider : coefficients métier selon la politique de l’entreprise.

## 6. Facteur d’inclinaison

$$\text{inclinationFactor} = 1 - \left|30 - \text{inclination}\right| \times 0.005$$

avec :

$$\text{inclinationFactor} \ge 0.5$$

- À valider : angle optimal réel selon la zone géographique.

## 7. Conversion orientation métier → PVGIS

- South = `0°`
- South-East = `-45°`
- East = `-90°`
- North-East = `-135°`
- North = `180°`
- North-West = `135°`
- West = `90°`
- South-West = `45°`

## 8. Coût matériel

$$\text{materialCost} = (\text{panelCount} \times \text{panelPrice}) + \text{inverterPrice}$$

- À valider : prix réels des équipements, transport, accessoires.

## 9. Main-d’œuvre

$$\text{installationLabor} = \text{materialCost} \times 0.15$$

- À valider : taux de main-d’œuvre réel de l’entreprise.

## 10. Coût total du projet

$$\text{totalProjectCost} = \text{materialCost} + \text{installationLabor}$$

- À valider : TVA, frais administratifs, maintenance.

## 11. Économies annuelles

$$\text{annualSavings} = \text{estimatedProduction} \times 0.28$$

- À valider : valeur exacte du kWh économisé.

## 12. Économies mensuelles

$$\text{monthlySavings} = \frac{\text{annualSavings}}{12}$$

## 13. CO2 évité

$$\text{co2Savings} = \text{estimatedProduction} \times 0.6$$

- À valider : facteur carbone officiel utilisé.

## 14. Investissement initial financier

$$\text{initialInvestment} =
\begin{cases}
\\text{estimatedCost} & \\text{si disponible} \\
\\text{totalCapacityKw} \\times 2500 & \\text{sinon}
\end{cases}$$

- À valider : coût moyen réel par kW.

## 15. Dégradation annuelle des panneaux

$$\text{currentProduction}_{n+1} = \text{currentProduction}_n \times (1 - 0.005)$$

- À valider : taux de dégradation garanti par le fabricant.

## 16. Hausse annuelle du prix de l’électricité

$$\text{currentElectricityPrice}_{n+1} = \text{currentElectricityPrice}_n \times (1 + 0.04)$$

- À valider : évolution réelle du tarif STEG.

## 17. Cash flow cumulé

$$\text{cashFlow}_0 = -\text{initialInvestment}$$

$$\text{cashFlow}_n = \text{cashFlow}_{n-1} + \text{yearSavings}$$

## 18. Temps de retour sur investissement

Quand le cash flow devient positif :

$$\text{payback} = (n-1) + \frac{|\text{previousCashFlow}|}{\text{yearSavings}}$$

## 19. ROI

$$\text{ROI} = \frac{\text{totalNetSavings}}{\text{initialInvestment}} \times 100$$

## 20. Formules Night Panel

### Stockage total

$$\text{totalStorageKwh} = \text{panelCount} \times \text{storagePerPanel}$$

### Production journalière

$$\text{dailyProductionKwh} = \frac{\text{annualProduction}}{365}$$

### Consommation de jour

$$\text{daytimeConsumption} = \text{dailyConsumption} \times 0.4$$

### Consommation de nuit

$$\text{nighttimeConsumption} = \text{dailyConsumption} \times 0.6$$

### Surplus de jour

$$\text{daytimeSurplus} = \max(0, \text{dailyProductionKwh} - \text{daytimeConsumption})$$

### Énergie stockée réellement

$$\text{actualStored} = \min(\text{daytimeSurplus}, \text{totalStorageKwh})$$

### Couverture nocturne

$$\text{nightCoverage} = \min(\text{actualStored}, \text{nighttimeConsumption})$$

### Taux d’autoconsommation

$$\text{selfConsumptionRate} = \min\left(1, \frac{\text{totalSelfConsumed}}{\text{dailyConsumption}}\right)$$

### Taux de couverture nocturne

$$\text{nightCoverageRate} = \min\left(1, \frac{\text{nightCoverage}}{\text{nighttimeConsumption}}\right)$$

### Économies annuelles améliorées

$$\text{enhancedAnnualSavings} = \text{totalSelfConsumed} \times 365 \times 0.280$$

### Économies liées au surplus réseau

$$\text{gridSavings} = \text{gridSurplus} \times 365 \times 0.10$$

### Économies annuelles totales

$$\text{totalAnnualSavings} = \text{enhancedAnnualSavings} + \text{gridSavings}$$

## Paramètres à valider avec la société

- Coefficient de surface utile
- Productivité moyenne kWh/kWp/an
- Facteurs d’orientation
- Facteurs d’inclinaison
- Prix moyen par kW installé
- Prix du kWh économisé
- Taux de dégradation annuel
- Taux d’inflation de l’électricité
- Taux de main-d’œuvre
- Facteur CO2

