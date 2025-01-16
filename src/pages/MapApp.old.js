import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MapApp.css';
import EditableSpan from '../components/EditableSpan.js'; // Importe le composant créé
import EditableH1 from '../components/EditableH1.js'; // Importe le composant créé
// import { Page, Text, View, Document, PDFDownloadLink } from '@react-pdf/renderer';
import jsPDF from 'jspdf';

const handleExportPDF = () => {
  const element = document.querySelector('.map-container'); // La div contenant la carte et la légende
};



// Fonction pour appliquer une échelle de couleur de blanc à bleu foncé selon le montant maximal modifiable
const colorScale = (value, maxSales) => {
  const intensity = Math.min(Math.floor((value / maxSales) * 255), 255); // Limite à 255
  return `rgb(${255 - intensity}, ${255 - intensity}, 255)`; // Blanc à bleu foncé
};

const detectDefaultColumns = (headers) => {
  let detectedDepartment = null;
  let detectedSales = null;

  headers.forEach((header, index) => {
    let lowerHeader;
    if (header) lowerHeader = header.toLowerCase();

    if (
      lowerHeader && 
      lowerHeader.slice("").length === 5
    ) {
      detectedDepartment = index;
    }

    if (
      lowerHeader &&
      lowerHeader.includes("€")
    ) {
      detectedSales = index;
    }
  });

  return {
    department: detectedDepartment,
    sales: detectedSales,
  };
};

// Fonction pour formater les nombres avec des espaces tous les trois chiffres
const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const MapApp = () => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [departmentData, setDepartmentData] = useState({});
  const [departmentColumn, setDepartmentColumn] = useState(null);
  const [salesColumn, setSalesColumn] = useState(null);
  const [totalSales, setTotalSales] = useState(0); // Chiffre d'affaires global
  const [totalInterventions, setTotalInterventions] = useState(0); // Chiffre d'affaires global
  const [maxSales, setMaxSales] = useState(50000); // Chiffre d'affaires max modifiable (départ à 50000 €)
  const [maxInter, setMaxInter] = useState(100); // Chiffre d'affaires max modifiable (départ à 50000 €)
  const [textMarkdown, setTextMarkdown] = useState("{depNum}\\n{depCAPercentage}%"); // Chiffre d'affaires max modifiable (départ à 50000 €)
  const [selectedDept, setSelectedDept] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [statType, setStatType] = useState(0);
  const [showTotalSales, setShowTotalSales] = useState(true); // Afficher Chiffre d'affaires global par défaut
  const [showTotalInterventions, setShowTotalInterventions] = useState(true); // Afficher Nombre d'interventions total par défaut
  const [deptSettings, setDeptSettings] = useState(
    JSON.parse(localStorage.getItem('deptSettings')) || {}
  );
  
  const svgRef = useRef(null);

  // Fonction pour obtenir les paramètres ajustés pour le département
  const getAdjustedCoordinates = (x, y, deptNum) => {
    const deptConfig = deptSettings[deptNum] || {};
    return {
      x: deptConfig.x !== undefined ? x + deptConfig.x : x,
      y: deptConfig.y !== undefined ? y + deptConfig.y : y,
      yLined: deptConfig.yLined || 0,
      fontSize: deptConfig.fontSize || "8px",
    };
  };

  // Fonction pour sauvegarder les paramètres du département
  const saveDeptSettings = () => {
    localStorage.setItem('deptSettings', JSON.stringify(deptSettings));
  };

  const handleDeptSettingChange = (key, value) => {
    setDeptSettings(prev => ({
      ...prev,
      [selectedDept]: {
        ...prev[selectedDept],
        [key]: value
      }
    }));
  };

  const initializeSVG = useCallback((svgDoc) => {
    const existingTexts = svgDoc.querySelectorAll('text');
    existingTexts.forEach((text) => text.remove());

    const paths = svgDoc.querySelectorAll('path[data-numerodepartement]');
    paths.forEach((path) => {
      const deptNum = path.getAttribute('data-numerodepartement');
      if (deptNum && departmentData[deptNum]) {
        const { sales, interventions } = departmentData[deptNum];
        console.log(interventions, maxInter)
        const color = (statType === 1 ? colorScale(interventions, maxInter) : colorScale(sales, maxSales));
        console.log(color, "color")
        path.style.fill = color;

        const salesPercentage = ((sales / totalSales) * 100).toFixed(2);
        const interventionsPercentage = ((interventions / totalInterventions) * 100).toFixed(2);
        const formattedText = textMarkdown
          .replace("{depNum}", `${deptNum}`)
          .replace("{depCAPercentage}", `${salesPercentage}`)
          .replace("{depINTPercentage}", `${interventionsPercentage}`);

        const baseX = path.getBBox().x + path.getBBox().width / 2;
        const baseY = path.getBBox().y + path.getBBox().height / 2;
        const { x: adjustedX, y: adjustedY, yLined, fontSize } = getAdjustedCoordinates(baseX, baseY, deptNum);

        const lines = formattedText.split('\\n').map((line, index) => ({
          text: line,
          x: adjustedX,
          y: adjustedY + index * (yLined || 8) - 2,
        }));

        lines.forEach(({ text, x, y }) => {
          const textElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "text");
          textElement.setAttribute("x", x);
          textElement.setAttribute("y", y);
          textElement.setAttribute("text-anchor", "middle");
          textElement.setAttribute("alignment-baseline", "central");
          textElement.setAttribute("font-size", fontSize);
          textElement.setAttribute("font-family", "Michroma, sans-serif");
          textElement.setAttribute("fill", "black");
          textElement.textContent = text;
          svgDoc.documentElement.appendChild(textElement);
        });
      }
    });
  }, [departmentData, totalSales, maxSales, maxInter, textMarkdown, deptSettings]);

  useEffect(() => {
    /** 
     *  INFINITE LOOP HERE 
     * */
    if (data.length > 0) {
      const detectedColumns = detectDefaultColumns(data[0]);
      if (detectedColumns.department !== null) {
        setDepartmentColumn(detectedColumns.department);
      }
      if (detectedColumns.sales !== null) {
        setSalesColumn(detectedColumns.sales);
      }
    }
    const svgObject = svgRef.current;
    if (svgObject && departmentData) {
      const svgDoc = svgObject.contentDocument;
      if (svgDoc) {
        initializeSVG(svgDoc);
      }
    }
    
    const savedSettings = localStorage.getItem('deptSettings');
    if (!savedSettings) {
      window.electron.config.defaultMap.then((defaultMap) => {
        setDeptSettings(defaultMap || {});
      });
    }
  }, [departmentData, totalSales, maxSales, maxInter, textMarkdown, data, initializeSVG]);

  const handleOpenFile = async () => {
    console.log(window.electron)
    const result = await window.electron.openFile();
    if (result && result.fileData !== data) {
      setData(result.fileData);    // Charger les données du fichier
      setFileName(result.fileName); // Stocker le nom du fichier
    }
  };

  const handlePDFConvertion = async () => {
    const result = await window.electron.toPDF();
    if (result) {
      setData(result.fileData);    // Charger les données du fichier
      setFileName(result.fileName); // Stocker le nom du fichier
    }
  };

  const handleProcessData = () => {
    if (departmentColumn !== null && salesColumn !== null) {
      const departments = {};
      let totalSalesTemp = 0;
  
      data.slice(1).forEach((row) => {
        let department = row[departmentColumn];
        const salesValue = row[salesColumn];

        // Convertir le département en string et le normaliser
        // if (department) {
        //   department = department.toString().padStart(5, '0'); // Ajoute un zéro si nécessaire
        // }

        if (department && salesValue !== undefined) {
          const departmentCode = department.slice(0, 2);
          const sales = parseFloat(salesValue) || 0;
  
          if (departments[departmentCode]) {
            departments[departmentCode].sales += sales;
            departments[departmentCode].interventions += 1;
          } else {
            let tempDep = parseInt(departmentCode);
            if (tempDep <= 99 && tempDep >= 1 ) departments[departmentCode] = { sales, interventions: 1 };
            if (isNaN(tempDep) && (departmentCode.startsWith("L") || departmentCode.startsWith("B")) ) departments[departmentCode] = { sales, interventions: 1 };
          }
  
          totalSalesTemp += sales;
        }
      });
  
      setDepartmentData(departments);
      setTotalSales(totalSalesTemp);
      setTotalInterventions(data.slice(1).length);
    }
  };  

  // Fonction pour mettre à jour le montant maximum et recalculer les couleurs
  const handleMaxSalesChange = (newMax) => {
    if (!isNaN(newMax)) {
      setMaxSales(newMax); // Met à jour le maxSales et applique le changement de couleur
    }
  };

  const handleMaxInterChange = (newMax) => {
    if (!isNaN(newMax)) {
      setMaxInter(newMax); // Met à jour le maxInter et applique le changement de couleur
    }
  };

  const handleStatType = (newType) => {
    setStatType(newType)
    setTextMarkdown(newType === 1 ? "{depNum}\\n{depINTPercentage}%" : "{depNum}\\n{depCAPercentage}%")
    setShowTotalInterventions(newType === 1 ? true : false)
    setShowTotalSales(newType === 1 ? false : true)
  };

  return (
    <div>
      <h5 onClick={() => setEditMode(!editMode)} style={{ cursor: "pointer" }}>Mode Edition</h5>
      {/* <h1>Carte Interactive de la France</h1> */}
      <EditableH1 editMode={editMode} value="Carte Interactive de la France" onChange={handleMaxInterChange} />
      <div className='excel'>
        <label>
          <button onClick={handleOpenFile}>Charger un fichier Excel</button>
          {fileName && `Fichier chargé: ${fileName}`}
        </label>

        {data.length > 0 && (
          <div>
            <h3>Sélectionnez les colonnes :</h3>
            <label>Colonne de département :</label>
            <select 
              onChange={(e) => setDepartmentColumn(parseInt(e.target.value, 10))}
              value={departmentColumn !== null ? departmentColumn : ""}
            >
              {data[0].map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            <br></br>

            <label>Colonne de chiffre d'affaires :</label>
            <select 
              onChange={(e) => setSalesColumn(parseInt(e.target.value, 10))}
              value={salesColumn !== null ? salesColumn : ""}
            >
              {data[0].map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            <br></br>

            <label>Formation du texte sur la carte :</label>
            <input className="input-box"
              type="text"
              value={textMarkdown}
              onChange={(e) => setTextMarkdown(e.target.value)}
              style={{ width: '200px', marginBottom: '10px' }}
            />

            <button onClick={handleProcessData}>Afficher sur la carte</button>
            <br></br>
            <button onClick={handleExportPDF}>Exporter en PDF</button>
          </div>
        )}
      </div>
      
      <div className="map-container">
        <div className="map-svg">
          <object
            ref={svgRef}
            type="image/svg+xml"
            data={`${process.env.PUBLIC_URL || ""}/svg/france region departement metropolitaine.svg`}
            className="svg-map"
          ></object>
        </div>

        <div className="legend">
          <h3>Légende</h3>
          {/* Affiche "Chiffre d'affaires global" seulement si showTotalSales est vrai */}
          {showTotalSales && (
            <h4>
              Chiffre d'affaires global : {formatNumber(totalSales.toFixed(2))} <span className="euro-logo">€</span>
            </h4>
          )}

          {/* Affiche "Nombre d'interventions total" seulement si showTotalInterventions est vrai */}
          {showTotalInterventions && (
            <h4>
              Nombre d'intervention total : {formatNumber(totalInterventions.toFixed(2))}
            </h4>
          )}

          {/* Champ de saisie pour le montant maximal */}
          {/* <label>Montant max de légende :</label>
          <input
            type="number"
            value={maxSales}
            onChange={handleMaxSalesChange}
            style={{ width: '100px', marginBottom: '10px' }}
          /> */}

          {/* Échelle de couleurs mise à jour en fonction du montant max */}
          {statType === 1 ? (
            <div className="color-scale">
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: 'rgb(255, 255, 255)' }}></div>
                <span>0</span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxInter * 0.25, maxInter) }}></div>
                <span>{formatNumber((maxInter * 0.25).toFixed(0))}</span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxInter * 0.5, maxInter) }}></div>
                <span>{formatNumber((maxInter * 0.5).toFixed(0))}</span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxInter * 0.75, maxInter) }}></div>
                <span>{formatNumber((maxInter * 0.75).toFixed(0))}</span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxInter, maxInter) }}></div>
                {console.log("&")}
                <EditableSpan editMode={editMode} value={maxInter} onChange={handleMaxInterChange} />
              </div>
            </div>
          ) : (
            <div className="color-scale">
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: 'rgb(255, 255, 255)' }}></div>
                <span>0 <span className="euro-logo">€</span></span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxSales * 0.25, maxSales) }}></div>
                <span>{formatNumber((maxSales * 0.25).toFixed(0))} <span className="euro-logo">€</span></span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxSales * 0.5, maxSales) }}></div>
                <span>{formatNumber((maxSales * 0.5).toFixed(0))} <span className="euro-logo">€</span></span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxSales * 0.75, maxSales) }}></div>
                <span>{formatNumber((maxSales * 0.75).toFixed(0))} <span className="euro-logo">€</span></span>
              </div>
              <div className="color-item">
                <div className="color-sample" style={{ backgroundColor: colorScale(maxSales, maxSales) }}></div>
                <EditableSpan editMode={editMode} value={maxSales} onChange={handleMaxSalesChange} euroLogo={true}/>
              </div>
            </div>
          )}
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
              <select onChange={(e) => setSelectedDept(e.target.value)} style={{ width: "100px"}}>
                <option value="">Sélectionnez un département</option>
                {Object.keys(departmentData).map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
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
    </div>
  );
};

export default MapApp;
