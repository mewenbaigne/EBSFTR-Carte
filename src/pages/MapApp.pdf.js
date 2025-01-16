import React, { useState, useCallback } from 'react';
import MapComponent from '../components/MapComponent.js';
import './MapApp.css';

const MapApp = () => {
  const [departmentData, setDepartmentData] = useState({});
  const [deptSettings, setDeptSettings] = useState({});
  const [selectedDept, setSelectedDept] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [fileName, setFileName] = useState(''); // Pour afficher le nom du fichier chargé

  const handleOpenFile = async () => {
    console.log(window.electron)
    const result = await window.electron.openFile();
    if (result && result.fileData !== data) {
      setData(result.fileData);      // Charger les données du fichier
      setFileName(result.fileName); // Stocker le nom du fichier
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await window.electron.openFile();
      if (result) {
        const { fileName: name, fileData } = result;
        setFileName(name);

        // Parsing des données pour correspondre à l'exemple
        const parsedData = fileData.slice(1).reduce((acc, row) => {
          const dept = row[0]; // Première colonne : Département
          acc[dept] = {
            sales: parseFloat(row[1] || 0), // Deuxième colonne : Chiffre d'affaires
            interventions: parseInt(row[2] || 0, 10), // Troisième colonne : Interventions
          };
          return acc;
        }, {});

        setDepartmentData(parsedData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du fichier Excel :', error);
    }
  };

  const totalSales = Object.values(departmentData).reduce(
    (sum, dept) => sum + dept.sales,
    0
  );

  const totalInterventions = Object.values(departmentData).reduce(
    (sum, dept) => sum + dept.interventions,
    0
  );

  const maxSales = Math.max(...Object.values(departmentData).map(dept => dept.sales));
  const maxInter = Math.max(...Object.values(departmentData).map(dept => dept.interventions));

  const colorScale = useCallback(
    (value, max) => {
      const percentage = value / max;
      const red = Math.floor(255 * (1 - percentage));
      const green = Math.floor(255 * percentage);
      return `rgb(${red}, ${green}, 0)`;
    },
    []
  );

  const getAdjustedCoordinates = useCallback(
    (baseX, baseY, deptNum) => {
      const settings = deptSettings[deptNum] || {};
      return {
        x: baseX + (settings.x || 0),
        y: baseY + (settings.y || 0),
        yLined: settings.yLined || 8,
        fontSize: settings.fontSize || '8px',
      };
    },
    [deptSettings]
  );

  const handleDeptSettingChange = (dept, field, value) => {
    setDeptSettings(prevSettings => ({
      ...prevSettings,
      [dept]: {
        ...prevSettings[dept],
        [field]: value,
      },
    }));
  };

  const saveDeptSettings = () => {
    console.log('Settings saved:', deptSettings);
  };

  const textMarkdown =
    "Dép. {depNum}\\nCA : {depCAPercentage}%\\nINT : {depINTPercentage}%";

  return (
    <div className="map-app">
      <header>
        <h1>Carte des Départements</h1>
        <button onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Quitter le mode édition' : 'Activer le mode édition'}
        </button>
        <button onClick={handleFileUpload} style={{ marginLeft: '1rem' }}>
          Charger un fichier Excel
        </button>
        {fileName && <p>Fichier chargé : {fileName}</p>}
      </header>

      <MapComponent
        departmentData={departmentData}
        totalSales={totalSales}
        totalInterventions={totalInterventions}
        maxSales={maxSales}
        maxInter={maxInter}
        textMarkdown={textMarkdown}
        statType={1} // 1 pour interventions, 2 pour CA
        colorScale={colorScale}
        showTotalSales={true}
        showTotalInterventions={true}
        deptSettings={deptSettings}
        getAdjustedCoordinates={getAdjustedCoordinates}
        editMode={editMode}
        selectedDept={selectedDept}
        onDeptSettingChange={handleDeptSettingChange}
        saveDeptSettings={saveDeptSettings}
        setSelectedDept={setSelectedDept}
      />
    </div>
  );
};

export default MapApp;
