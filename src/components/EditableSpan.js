import React, { useState, useRef, useEffect } from 'react';

const EditableSpan = ({ editMode, value, onChange, euroLogo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value); // Mettre à jour inputValue chaque fois que value change
  }, [value]);

  // Active le mode édition
  const handleSpanClick = () => {
    if (editMode) setIsEditing(true);
    setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 0);
  };

  // Gère le changement de valeur
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Gère la validation de la valeur (entrée ou clic extérieur)
  const handleBlurOrEnter = () => {
    setIsEditing(false);
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue) && parsedValue !== value) {
      onChange(parsedValue); // Envoie la nouvelle valeur au parent
    }
  };

  const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlurOrEnter}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBlurOrEnter();
          }}
          style={{
            width: `${inputValue.toString().length + 1}ch`, // Ajuste la largeur
            border: 'none',
            outline: 'none',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            backgroundColor: 'transparent',
            textAlign: 'center',
          }}
        />
      ) : (
        <span onClick={handleSpanClick} style={editMode ? { cursor: 'pointer' } : {}}>
          {formatNumber(inputValue)} {euroLogo ? (<span className="euro-logo">€</span>) : ""}
        </span>
      )}
    </>
  );
};

export default EditableSpan;
