import React, { useState, useEffect, useRef, useCallback } from 'react';
import EditableH1 from '../components/EditableH1.js'; // Importe le composant créé
import { PDFDownloadLink } from '@react-pdf/renderer';
// import { Page, Text, View, Document, PDFDownloadLink } from '@react-pdf/renderer';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import MapComponent from '../components/MapComponent.js';
import MapPDF from '../components/MapPDF.js';
import './MapApp.css';

// const handleExportPDF = () => {
//   const element = document.querySelector('.map-container'); // La div contenant la carte et la légende
// };

// Fonction pour appliquer une échelle de couleur de blanc à bleu foncé selon le montant maximal modifiable
const colorScale = (value, maxSales) => {
  const intensity = Math.min(Math.floor((value / maxSales) * 255), 255); // Limite à 255
  return `rgb(${255 - intensity}, ${255 - intensity}, 255)`; // Blanc à bleu foncé
};

const REGEX = {
  SALES_COLUMN: /^\s?\d{1,3}(?:\d{3})*\.\d{2} € $/,
  DEPARTMENTS_COLUMN: /^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/
}

const detectDefaultColumns = (headers) => {
  let detectedDepartment = null;
  let detectedSales = null;

  headers.forEach((header, index) => {
    let lowerHeader;
    if (header) lowerHeader = header.toLowerCase();

    if (
      lowerHeader && 
      lowerHeader.match(REGEX.DEPARTMENTS_COLUMN)
    ) {
      detectedDepartment = index;
    }
    console.log("tg", lowerHeader ? (lowerHeader.match(REGEX.SALES_COLUMN) ? lowerHeader.match(REGEX.SALES_COLUMN) : lowerHeader.match(REGEX.DEPARTMENTS_COLUMN)) : lowerHeader, header)
    if (
      lowerHeader &&
      lowerHeader.match(REGEX.SALES_COLUMN)
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
  const [autoDetectDone, setAutoDetectDone] = useState(false);
  const [isDepartmentAutoDetected, setIsDepartmentAutoDetected] = useState(false);
  const [isSalesAutoDetected, setIsSalesAutoDetected] = useState(false);
  // const [svgString, setSvgString] = useState(null)
  const [loading, setLoading] = useState(false);
  const [deptSettings, setDeptSettings] = useState(
    JSON.parse(localStorage.getItem('deptSettings')) || {}
  );
  
  const svgRef = useRef(null);
  const mapComponentRef = useRef(null);

  useEffect(() => {
    document.title = 'EBSFTR - Carte';
  })

  const handleDownload = async (svgString) => {
    setLoading(true);
    try {
      const blob = await pdf(
        <MapPDF
          svgString={svgString}
          totalSales={totalSales}
          totalInterventions={totalInterventions}
          maxSales={maxSales}
          maxInter={maxInter}
          showTotalSales={showTotalSales}
          showTotalInterventions={showTotalInterventions}
          colorScale={colorScale}
          statType={statType}
        />
      ).toBlob();
      console.log(window.electron)
      // Ouvrir la boîte de dialogue pour choisir l'emplacement du fichier
      // const result = await window.electron.saveFile();
      
      // if (!result.canceled && result.filePath) {
        // Sauvegarder le fichier avec FileSaver
        saveAs(blob);
        console.log('Fichier enregistré avec succès :', /*result.filePath*/);
      // }
    } catch (error) {
      console.error('Erreur lors de la génération ou de la sauvegarde du PDF :', error);
    } finally {
      setLoading(false);
    }
  };

  function getSVGStringFromObject(svgRef) {
    const svgObject = svgRef.current;
  
    if (!svgObject) {
      console.error("L'objet SVG référencé n'existe pas.");
      return null;
    }
  
    const svgDocument = svgObject.contentDocument;
    if (!svgDocument) {
      console.error("Impossible d'accéder au document SVG dans l'objet <object>.");
      return null;
    }
  
    const svgElement = svgDocument.querySelector('svg');
    if (!svgElement) {
      console.error("Aucun élément SVG trouvé dans le document de l'<object>.");
      return null;
    }
  
    // Convertir l'élément SVG en chaîne de caractères
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
  
    return svgString;
  }

  const handleGeneratePdf = async () => {
    const image = await getSVGStringFromObject(svgRef);
    console.log("IL M'AGE", image)
    if (image) {
      // setSvgString(image);
      handleDownload(image)
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'px',
    });

    // Adding the fonts.
    doc.setFont('Inter-Regular', 'normal');

    doc.html(mapComponentRef.current, {
      async callback(doc) {
        await doc.save('document');
      },
    });
  };

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
    if (!autoDetectDone && data.length > 0) {
      const detectedColumns = detectDefaultColumns(data[0]);

      if (detectedColumns.department !== null) {
        setDepartmentColumn(detectedColumns.department);
        setIsDepartmentAutoDetected(true);
      }

      if (detectedColumns.sales !== null) {
        setSalesColumn(detectedColumns.sales);
        setIsSalesAutoDetected(true);
      }

      setAutoDetectDone(true);
    }
  }, [autoDetectDone, data]);

  useEffect(() => {
    const loadDefaultMap = async () => {
      const savedSettings = localStorage.getItem('deptSettings');
      if (!savedSettings) {
        const defaultMap = await window.electron.config.defaultMap;
        setDeptSettings(defaultMap || {});
      }
    };
    loadDefaultMap();
  }, []); 

  // useEffect(() => {
  //   /** 
  //    *  INFINITE LOOP HERE 
  //    * */
  //   if (!autoDetectDone && data.length > 0) {
  //     const detectedColumns = detectDefaultColumns(data[0]);
  
  //     if (detectedColumns.department !== null) {
  //       setDepartmentColumn(detectedColumns.department);
  //       setIsDepartmentAutoDetected(true); // Marque comme détecté automatiquement
  //     }
  
  //     if (detectedColumns.sales !== null) {
  //       setSalesColumn(detectedColumns.sales);
  //       setIsSalesAutoDetected(true); // Marque comme détecté automatiquement
  //     }
  
  //     // Marquer la détection comme terminée
  //     setAutoDetectDone(true);
  //   }
  //   const svgObject = svgRef.current;
  //   if (svgObject && departmentData) {
  //     const svgDoc = svgObject.contentDocument;
  //     if (svgDoc) {
  //       initializeSVG(svgDoc);
  //     }
  //   }
    
  //   const savedSettings = localStorage.getItem('deptSettings');
  //   if (!savedSettings) {
  //     window.electron.config.defaultMap.then((defaultMap) => {
  //       setDeptSettings(defaultMap || {});
  //     });
  //   }
  // }, [departmentData, totalSales, maxSales, maxInter, textMarkdown, autoDetectDone, data, initializeSVG]);

  const handleDepartmentColumnChange = (e) => {
    setDepartmentColumn(parseInt(e.target.value, 10));
    setIsDepartmentAutoDetected(false); // Indique que c'est manuel
  };
  
  const handleSalesColumnChange = (e) => {
    setSalesColumn(parseInt(e.target.value, 10));
    setIsSalesAutoDetected(false); // Indique que c'est manuel
  };

  const handleOpenFile = async () => {
    console.log(window.electron)
    const result = await window.electron.openFile();
    if (result && result.fileData !== data) {
      setData(result.fileData);    // Charger les données du fichier
      setFileName(result.fileName); // Stocker le nom du fichier
      setAutoDetectDone(false);    // Réinitialiser la détection automatique
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
      // console.log("DATATA", data)
      data.slice(1).forEach((row) => {
        let department = row[departmentColumn];
        const salesValue = row[salesColumn];

        // Convertir le département en string et le normaliser
        // if (department) {
        //   department = department.toString().padStart(5, '0'); // Ajoute un zéro si nécessaire
        // }

        if (department) {
          const departmentCode = department.slice(0, 2);
          let sales = 0;
          if (salesValue !== undefined) sales = parseFloat(salesValue.replace(",", "")) || 0;
          // console.log("salesValues", salesValue, sales)
  
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
      <h5 onClick={() => setEditMode(!editMode)} style={{ cursor: "pointer", position: "fixed", zIndex: 1000, top: "30px" }}>Mode Edition</h5>
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
              onChange={handleDepartmentColumnChange}
              value={departmentColumn !== null ? departmentColumn : ""}
            >
              {data[0].map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            {isDepartmentAutoDetected && <label style={{fontSize: "10px"}}>(Trouvé)</label>}
            <br></br>

            <label>Colonne de chiffre d'affaires :</label>
            <select 
              onChange={handleSalesColumnChange}
              value={salesColumn !== null ? salesColumn : ""}
            >
              {data[0].map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            {isSalesAutoDetected && <label style={{fontSize: "10px"}}>(Trouvé)</label>}
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
            <button onClick={handleGeneratePdf} disabled={loading}>{loading ? "Exportation" : "Exporter en PDF"}</button>
            {/* {svgString && (
              <PDFDownloadLink
                document={
                  <MapPDF
                    svgString={svgString}
                    totalSales={totalSales}
                    totalInterventions={totalInterventions}
                    maxSales={maxSales}
                    maxInter={maxInter}
                    colorScale={colorScale}
                    statType={statType}
                  />
                }
                fileName="Carte_Departements.pdf"
                onDownloadStart={(e) => console.log(e)}  // Avant le téléchargement
                onDownloadSuccess={(e) => console.log(e)} // Après que le fichier soit téléchargé
                onDownloadError={(e) => console.log(e)}  // En cas d'erreur
              >
                {({ loading }) =>
                  loading ? 'Chargement du PDF...' : 'Télécharger le PDF'
                }
              </PDFDownloadLink>
            )} */}
          </div>
        )}
      </div>
      <div ref={mapComponentRef}>
        <MapComponent
          svgRef={svgRef}
          departmentData={departmentData}
          totalSales={totalSales}
          totalInterventions={totalInterventions}
          maxSales={maxSales}
          maxInter={maxInter}
          textMarkdown={textMarkdown}
          statType={statType} // 1 pour interventions, 2 pour CA
          colorScale={colorScale}
          showTotalSales={showTotalSales}
          showTotalInterventions={showTotalInterventions}
          deptSettings={deptSettings}
          getAdjustedCoordinates={getAdjustedCoordinates}
          editMode={editMode}
          selectedDept={selectedDept}
          handleDeptSettingChange={handleDeptSettingChange}
          saveDeptSettings={saveDeptSettings}
          setSelectedDept={setSelectedDept}
          handleMaxInterChange={handleMaxInterChange}
          handleMaxSalesChange={handleMaxSalesChange}
          handleStatType={handleStatType}
          setShowTotalSales={setShowTotalSales}
          setShowTotalInterventions={setShowTotalInterventions}
        />
      </div>
    </div>
  );
};

export default MapApp;
