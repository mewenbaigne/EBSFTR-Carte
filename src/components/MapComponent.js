import React, { useRef, useEffect, useCallback } from 'react';
import EditableSpan from './EditableSpan.js';
// import './MapComponent.css'; // Ajoutez des styles spécifiques si nécessaire

const MapComponent = ({
  svgRef,
  departmentData,
  totalSales,
  totalInterventions,
  maxSales,
  maxInter,
  textMarkdown,
  statType,
  colorScale,
  showTotalSales,
  showTotalInterventions,
  deptSettings,
  getAdjustedCoordinates,
  editMode,
  selectedDept,
  handleDeptSettingChange,
  saveDeptSettings,
  setSelectedDept,
  handleMaxInterChange,
  handleMaxSalesChange,
  handleStatType,
  setShowTotalSales,
  setShowTotalInterventions
}) => {
  const initializeSVG = useCallback(
    (svgDoc) => {
      const existingTexts = svgDoc.querySelectorAll('text');
      existingTexts.forEach((text) => text.remove());

      const paths = svgDoc.querySelectorAll('path[data-numerodepartement]');
      paths.forEach((path) => {
        const deptNum = path.getAttribute('data-numerodepartement');
        if (deptNum && departmentData[deptNum]) {
          const { sales, interventions } = departmentData[deptNum];
          const color =
            statType === 1
              ? colorScale(interventions, maxInter)
              : colorScale(sales, maxSales);

          path.style.fill = color;

          const salesPercentage = ((sales / totalSales) * 100).toFixed(2);
          const interventionsPercentage = (
            (interventions / totalInterventions) *
            100
          ).toFixed(2);

          const formattedText = textMarkdown
            .replace('{depNum}', `${deptNum}`)
            .replace('{depCAPercentage}', `${salesPercentage}`)
            .replace('{depINTPercentage}', `${interventionsPercentage}`);

          const baseX = path.getBBox().x + path.getBBox().width / 2;
          const baseY = path.getBBox().y + path.getBBox().height / 2;
          const { x: adjustedX, y: adjustedY, yLined, fontSize } =
            getAdjustedCoordinates(baseX, baseY, deptNum);

          const lines = formattedText.split('\\n').map((line, index) => ({
            text: line,
            x: adjustedX,
            y: adjustedY + index * (yLined || 8) - 2,
          }));

          lines.forEach(({ text, x, y }) => {
            const textElement = svgDoc.createElementNS(
              'http://www.w3.org/2000/svg',
              'text'
            );
            textElement.setAttribute('x', x);
            textElement.setAttribute('y', y);
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('alignment-baseline', 'central');
            textElement.setAttribute('font-size', fontSize);
            textElement.setAttribute('font-family', 'Michroma, sans-serif');
            textElement.setAttribute('fill', 'black');
            textElement.textContent = text;
            svgDoc.documentElement.appendChild(textElement);
          });
        }
      });
    },
    [departmentData, totalSales, maxSales, maxInter, textMarkdown, deptSettings]
  );

  useEffect(() => {
    const svgObject = svgRef.current;
    if (svgObject) {
      const svgDoc = svgObject.contentDocument;
      if (svgDoc) {
        initializeSVG(svgDoc);
      }
    }
  }, [initializeSVG]);

  return (
    <div className="map-container">
      <div className="map-svg">
        <object
          ref={svgRef}
          type="image/svg+xml"
          data={`${process.env.PUBLIC_URL || ''}/svg/france region departement metropolitaine.svg`}
          className="svg-map"
        ></object>
      </div>

      <div className="legend">
        <h3>Légende</h3>
        {showTotalSales && (
          <h4>
            Chiffre d'affaires global : {totalSales.toLocaleString()} <span className='euro-logo'>€</span>
          </h4>
        )}
        {showTotalInterventions && (
          <h4>Nombre d'interventions total : {totalInterventions}</h4>
        )}

        <div className="color-scale">
          {statType === 1 ? (
            <>
              {/* Échelle pour les interventions */}
              {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                <div key={step} className="color-item">
                  <div
                    className="color-sample"
                    style={{
                      backgroundColor: colorScale(maxInter * step, maxInter),
                    }}
                  ></div>
                  {step === 1 ? <EditableSpan editMode={editMode} value={maxInter} onChange={handleMaxInterChange} /> : <span>{(maxInter * step).toFixed(0)}</span>}
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Échelle pour le chiffre d'affaires */}
              {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                <div key={step} className="color-item">
                  <div
                    className="color-sample"
                    style={{
                      backgroundColor: colorScale(maxSales * step, maxSales),
                    }}
                  ></div>
                  <span>
                    {step === 1 ? <EditableSpan editMode={editMode} value={maxSales} onChange={handleMaxSalesChange} euroLogo={true} /> : <span>{(maxSales * step).toFixed(0)} <span className="euro-logo">€</span></span>}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
        {editMode && (
          <div className="controls">
            <h3>Paramètres globaux</h3>
            {/* Checkbox pour afficher/masquer le chiffre d'affaires global */}
            <label>
              <input
                type="checkbox"
                checked={statType}
                onChange={() => handleStatType(statType === 1 ? 0 : 1)}
              />
              Type de statistiques ({statType === 1 ? "Interventions" : "Chiffre d'Affaire"})
            </label>
            <br></br>
            
            {/* Checkbox pour afficher/masquer le chiffre d'affaires global */}
            <label>
              <input
                type="checkbox"
                checked={showTotalSales}
                onChange={(e) => setShowTotalSales(e.target.checked)}
              />
              Afficher Chiffre d'affaires global
            </label>
            <br></br>

            {/* Checkbox pour afficher/masquer le nombre d'interventions total */}
            <label>
              <input
                type="checkbox"
                checked={showTotalInterventions}
                onChange={(e) => setShowTotalInterventions(e.target.checked)}
              />
              Afficher Nombre d'interventions total
            </label>
            <h3>Paramètres de position</h3>
            <label>Département :</label>
            <select
              onChange={(e) => setSelectedDept(e.target.value)}
              value={selectedDept || ''}
              style={{ width: "100px"}}
            >
              <option value="">Sélectionnez un département</option>
              {Object.keys(departmentData).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {selectedDept && (
              <div>
                <label>X Offset :</label>
                <input className="input-box"
                  type="number"
                  value={deptSettings[selectedDept]?.x || 0}
                  onChange={(e) => handleDeptSettingChange('x', parseInt(e.target.value))}
                  style={{ width: "50px"}}
                />
                <br></br>
                <label>Y Offset :</label>
                <input className="input-box"
                  type="number"
                  value={deptSettings[selectedDept]?.y || 0}
                  onChange={(e) => handleDeptSettingChange('y', parseInt(e.target.value))}
                  style={{ width: "50px"}}
                />
                <br></br>
                <label>Espacement entre lignes :</label>
                <input className="input-box"
                  type="number"
                  value={deptSettings[selectedDept]?.yLined || 8}
                  onChange={(e) => handleDeptSettingChange('yLined', parseInt(e.target.value))}
                  style={{ width: "50px"}}
                />
                <br></br>
                <label>Taille de police :</label>
                <input className="input-box"
                  type="text"
                  value={deptSettings[selectedDept]?.fontSize || "8px"}
                  onChange={(e) => handleDeptSettingChange('fontSize', e.target.value)}
                  style={{ width: "50px"}}
                />
                <button onClick={saveDeptSettings}>Sauvegarder</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;