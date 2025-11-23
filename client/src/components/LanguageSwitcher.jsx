import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Map languages to flag URLs
    const flags = {
        en: 'https://flagcdn.com/w80/gb.png',
        es: 'https://flagcdn.com/w80/es.png'
    };

    // Get current language (default to 'en' if not found)
    const currentLang = i18n.language?.split('-')[0] || 'en';
    const currentFlag = flags[currentLang] || flags['en'];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50 }}>
            {/* Main Button - Shows Current Flag */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '2px solid white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    backgroundImage: `url(${currentFlag})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'transform 0.2s',
                }}
                title="Select Language"
            />

            {/* Dropdown Flags */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.2s ease-in-out'
                }}>
                    {/* English Flag (UK) */}
                    <button
                        onClick={() => changeLanguage('en')}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            padding: 0,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            backgroundImage: `url(${flags.en})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: currentLang === 'en' ? 1 : 0.7 // Dim if not selected? Or maybe just show all
                        }}
                        title="English"
                    />

                    {/* Spanish Flag */}
                    <button
                        onClick={() => changeLanguage('es')}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            padding: 0,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            backgroundImage: `url(${flags.es})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: currentLang === 'es' ? 1 : 0.7
                        }}
                        title="Español"
                    />
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
