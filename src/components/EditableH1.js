import React, { useState, useRef, useEffect } from 'react';

const EditableH1 = ({ editMode, value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value); // Met à jour `inputValue` chaque fois que `value` change
  }, [value]);

  // Active le mode édition
  const handleH1Click = () => {
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

  return (
    <>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlurOrEnter}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBlurOrEnter();
          }}
          style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '2em',          // Ajuste la taille de police au même niveau que `h1`
            fontFamily: 'inherit',
            width: `${inputValue.toString().length + 1}ch`, // Ajuste la largeur
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent', // Fond transparent pour se fondre dans le fond de la page
            cursor: 'pointer'
          }}
        />
      ) : (
        <h1 onClick={handleH1Click} style={editMode ? { cursor: 'pointer' } : {}}>
          {inputValue}
        </h1>
      )}
    </>
  );
};

export default EditableH1;