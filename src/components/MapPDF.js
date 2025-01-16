import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { SVGToComponent } from './SVGToComponent.js';

const MichromaFont = `${process.env.PUBLIC_URL || ''}/fonts/Michroma-Regular.ttf`
Font.register({ family: 'Michroma', src: MichromaFont })

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Michroma',
    backgroundColor: '#131313',
    color: 'white',
  },
  mapContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'flex-start',
  },
  mapSvg: {
    flex: 2,
    maxWidth: '70%',
    marginRight: 20,
  },
  legend: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    color: '#000',
    fontSize: 12,
    lineHeight: 1.4,
    height: 200
  },
  legendTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10
  },
  legendRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 10
  },
  colorSample: {
    width: 20,
    height: 20,
    borderRadius: 3,
    marginRight: 10
  },
  stats: {
    fontSize: 8,
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10
  },
  euroText: {
    fontFamily: "Courier"
  },
});

// Générer les échelles de couleurs pour la légende
const generateColorScale = (maxValue, colorScale) => {
  const steps = [0, 0.25, 0.5, 0.75, 1]; // Les 5 étapes de l'échelle
  return steps.map((step, index) => ({
    color: colorScale(maxValue * step, maxValue),
    value: (maxValue * step).toFixed(0),
    key: index,
  }));
};

const MapPDF = ({
  svgString,
  totalSales,
  totalInterventions,
  maxSales,
  maxInter,
  showTotalSales,
  showTotalInterventions,
  colorScale,
  statType,
}) => {
  // Générer les échelles dynamiques
  const legendData = generateColorScale(
    statType === 1 ? maxInter : maxSales,
    colorScale
  );

  function addNamespaceToSVG(svgString) {
    if (!svgString.startsWith('<svg')) return svgString;
  
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace(
        '<svg',
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }
  
    return svgString;
  }
  console.log(svgString,"sss")
  const svgComponent = SVGToComponent(addNamespaceToSVG(svgString));

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.mapContainer}>
          {/* Carte SVG */}
          <View style={styles.mapSvg}>
            {svgString ? (
              {svgComponent}
                // <Text>En Chantier</Text>
            ) : (
              <Text>Carte SVG non disponible</Text>
            )}
          </View>

          {/* Légende */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>
                Légende
            </Text>
            <View style={styles.stats}>
              {showTotalSales && 
                <Text>
                    Chiffre d'affaires global : {totalSales.toLocaleString()} <Text styles={styles.euroTexts}>€</Text>
                </Text>
              }
              {showTotalInterventions && 
                <Text>
                    Nombre d'interventions : {totalInterventions.toLocaleString()}
                </Text>
              }
            </View>
            {legendData.map((entry) => (
              <View key={entry.key} style={styles.legendRow}>
                <View
                  style={{
                    ...styles.colorSample,
                    backgroundColor: entry.color,
                  }}
                />
                <Text>{entry.value} {statType === 1 ? '' : <Text style={styles.euroText}>€</Text>}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default MapPDF;
