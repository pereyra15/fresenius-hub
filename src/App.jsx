import './index.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE ENTORNO Y FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCsWVfOwrluoXkJ2DZI53riT1GP7hfgO1s",
      authDomain: "fresenius-hub.firebaseapp.com",
      projectId: "fresenius-hub",
      storageBucket: "fresenius-hub.firebasestorage.app",
      messagingSenderId: "716717456335",
      appId: "1:716717456335:web:34cce7beae617a9de870ba"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fresenius-hub-v1';

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycby-qGJlQG_vxJMxqYKK0EBDkFJXLbLi7Gby7fCpej0ZnDgMpT0YsXELWwbvxOVsrTSkhg/exec"; 

const mockEngineers = [
  'WS06 JORGE VELAZQUEZ', 'WS07 EDGAR NUÑO', 'WS09 ZAHIRA ISLAS',
  'WS10 JUAN CARLOS SAAVEDRA', 'WS11 JORGE DIAZ', 'WS12 HIRAM ALVAREZ', 'WS15 VICTOR ENRIQUEZ'
];

const fallaMapping = [
  { key: 'General', code: 'FA22', desc: 'TCT-Generales' },
  { key: 'Recertificaci', code: 'FA23', desc: 'TCT-Recertificación' },
  { key: 'Instalaci', code: 'FA24', desc: 'TCT-Instalación' },
  { key: 'Asesoria', code: 'FA25', desc: 'TCT-Asesoría' },
  { key: 'Calibra', code: 'FA26', desc: 'TCT-Calibración' },
  { key: 'Kit', code: 'FA27', desc: 'TCT-Problema con kit' },
  { key: 'Atenci', code: 'FA28', desc: 'TCT-Atención remota' },
  { key: 'Parte', code: 'FA29', desc: 'TCT-Partes de equipo' },
  { key: 'Clamp', code: 'FA30', desc: 'TCT-Clamp' },
  { key: 'Comprobaci', code: 'FA31', desc: 'TCT-Comprobación de cierre' },
  { key: 'Presi', code: 'FA32', desc: 'TCT-Perdida de vacío' },
  { key: 'Vac', code: 'FA32', desc: 'TCT-Perdida de vacío' },
  { key: 'Perita', code: 'FA33', desc: 'TCT-Perita/Manguito desconectado' },
  { key: 'Membrana', code: 'FA34', desc: 'TCT-Membrana' },
  { key: 'Interface', code: 'FA35', desc: 'TCT-Detector de interfaz' },
  { key: 'Humedad', code: 'FA36', desc: 'TCT-Sensor de humedad' },
  { key: 'Sell', code: 'FA37', desc: 'TCT-Módulo de RF' }, 
  { key: 'Cable', code: 'FA38', desc: 'TCT-Cable' },
  { key: 'Tarjeta', code: 'FA39', desc: 'TCT-Tarjeta principal' },
  { key: 'Bater', code: 'FA40', desc: 'TCT-Batería' },
  { key: 'Prensa', code: 'FA41', desc: 'TCT-Prensas' },
  { key: 'Balanza', code: 'FA42', desc: 'TCT-Balanzas' },
  { key: 'Uso', code: 'FA45', desc: 'TCT-Mal Uso' },
  { key: 'Preventivo', code: 'FA46', desc: 'TCT-Preventivo' },
];

const Input = ({ label, name, type = 'text', value, onChange, maxLength, inputMode, readOnly, placeholder, list }) => (
  <div className="mb-4 text-left">
    <label className="block text-gray-700 text-[10px] font-black mb-1 uppercase tracking-wider">{label}</label>
    <input
      className={`w-full p-4 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-100 focus:border-blue-500'}`}
      type={type} name={name} value={value} onChange={onChange} maxLength={maxLength} 
      inputMode={inputMode} readOnly={readOnly} placeholder={placeholder} list={list}
    />
  </div>
);

const TextArea = ({ label, name, value, onChange, rows = 3, placeholder, readOnly }) => (
  <div className="mb-4 text-left">
    <label className="block text-gray-700 text-[10px] font-black mb-1 uppercase tracking-wider">{label}</label>
    <textarea
      className={`w-full p-4 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-100 focus:border-blue-500'}`}
      name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} readOnly={readOnly}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options, placeholder = "Seleccionar..." }) => (
  <div className="mb-4 text-left">
    <label className="block text-gray-700 text-[10px] font-black mb-1 uppercase tracking-wider">{label}</label>
    <select
      className={`w-full p-4 border rounded-2xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none border-gray-100 ${value === '' ? 'text-gray-400' : 'text-gray-700'}`}
      name={name} value={value} onChange={onChange}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);

const MenuButton = ({ label, subScreenId, svgIcon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center p-5 rounded-[1.5rem] transition-all transform hover:scale-[1.02] shadow-lg w-full border-2 bg-white text-gray-800 hover:bg-blue-50 border-gray-50"
    >
      <div className="mr-4 text-blue-600">
        <div className="w-8 h-8">{svgIcon}</div>
      </div>
      <span className="font-black text-lg text-left flex-1 tracking-tight">{label}</span>
      <div className="ml-2 text-gray-300">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
      </div>
    </button>
  );
};

const EquiposSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><path d="M10 2v4M14 2v4M6 13h12M6 17h12M6 9h12"></path></svg>
);
const ReporteEquiposSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.93-3.89L6 19l2.16-4.32L4 12l4.16-2.68L6 5l4.07 1.25L12 2l1.93 4.25L18 5l-2.16 4.32L20 12l-4.16 2.68L18 19l-4.07-1.56L12 21.35zM12 8v4M12 16h.01"></path></svg>
);
const MaterialApoyoSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2zM10 10l-2 2 2 2"></path></svg>
);
const ContactosSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const LandingScreen = ({ setScreen }) => (
  <div className="flex flex-col gap-6 animate-fadeIn pb-10">
    <div className="text-center mb-10">
      <div className="inline-block p-4 bg-blue-50 rounded-3xl mb-4">
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
      </div>
      <h1 className="text-5xl font-black text-blue-700 tracking-tighter">FRESENIUS</h1>
      <p className="text-[10px] font-black text-gray-400 tracking-[0.4em] mt-2 uppercase">Engineering Hub</p>
    </div>
    <button onClick={() => setScreen('register')} className="p-8 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-xl hover:border-blue-500 transition-all group flex items-center gap-6">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div>
      <div className="text-left"><span className="block font-black text-gray-800 text-lg uppercase tracking-tight leading-none">Registrarse</span><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Crear nueva cuenta</span></div>
    </button>
    <button onClick={() => setScreen('login')} className="p-8 bg-blue-600 rounded-[2.5rem] shadow-xl hover:bg-blue-700 transition-all group flex items-center gap-6">
      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg></div>
      <div className="text-left"><span className="block font-black text-white text-lg uppercase tracking-tight leading-none">Ingresar</span><span className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Acceso restringido</span></div>
    </button>
  </div>
);

const RegisterScreen = ({ form, onChange, onSubmit, loading, goBack }) => (
  <div className="animate-fadeIn pb-10">
    <div className="flex items-center gap-4 mb-8"><button onClick={goBack} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">←</button><h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Registro</h2></div>
    <div className="space-y-1">
      <Select label="Nombre de Ingeniero *" name="engineerName" value={form.engineerName} onChange={onChange} options={mockEngineers} />
      <Input label="Correo Electrónico *" name="email" type="email" value={form.email} onChange={onChange} placeholder="ejemplo@fmc-ag.com" />
      <Input label="Teléfono de Contacto *" name="phone" value={form.phone} onChange={onChange} placeholder="5512345678" />
      <Input label="Contraseña (PIN) *" name="password" type="password" value={form.password} onChange={onChange} maxLength={6} placeholder="••••••" />
      <button onClick={onSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl mt-4 shadow-xl active:scale-95 transition-all uppercase disabled:opacity-50">{loading ? 'Procesando...' : 'Crear Cuenta'}</button>
      <p className="text-[8px] font-black text-gray-400 uppercase mt-4 text-center tracking-widest">* Todos los campos son obligatorios</p>
    </div>
  </div>
);

const LoginScreen = ({ form, onChange, onSubmit, loading, goBack }) => (
  <div className="animate-fadeIn pb-10">
    <div className="flex items-center gap-4 mb-8"><button onClick={goBack} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">←</button><h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Ingreso</h2></div>
    <div className="space-y-1">
      <Select label="Seleccionar Ingeniero *" name="engineerName" value={form.engineerName} onChange={onChange} options={mockEngineers} />
      <Input label="PIN de Acceso *" name="password" type="password" value={form.password} onChange={onChange} maxLength={6} placeholder="••••••" />
      <button onClick={onSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl mt-8 shadow-xl active:scale-95 transition-all uppercase disabled:opacity-50">{loading ? 'Verificando...' : 'Entrar'}</button>
      <p className="text-[8px] font-black text-gray-400 uppercase mt-4 text-center tracking-widest">* PIN e Ingeniero son obligatorios</p>
    </div>
  </div>
);

const MenuScreen = ({ 
  menuSubScreen, setMenuSubScreen, loginForm, setScreen, setMessage, setError, userId, db,
  contacts, addContact, deleteContact, sheetOrders, setSheetOrders, equipment,
  documentationSubScreen, setDocumentationSubScreen, currentSparePartView, setCurrentSparePartView, goBack, navigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showResetOSConfirm, setShowResetOSConfirm] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', unit: '', email: '' });
  const [sparePartsData, setSparePartsData] = useState([]);
  const [loadingSpares, setLoadingSpares] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [closingOrder, setClosingOrder] = useState(false);

  const [reportForm, setReportForm] = useState({
    tipoOS: '', serie: '', modelo: '', descripcionEquipo: '', fechaSolicitud: new Date().toISOString().split('T')[0],
    ano: new Date().getFullYear().toString(), cliente: '', ingeniero: loginForm.engineerName || '',
    falla: '', area: '', reporta: '', contacto: '', telefono: '', email: '', observaciones: '',
    catalogoFalla: 'FKMX-CS', codigoFalla: '', descripcionFalla: ''
  });

  const resetOSForm = () => {
    setReportForm({
      tipoOS: '', serie: '', modelo: '', descripcionEquipo: '', fechaSolicitud: new Date().toISOString().split('T')[0],
      ano: new Date().getFullYear().toString(), cliente: '', ingeniero: loginForm.engineerName || '',
      falla: '', area: '', reporta: '', contacto: '', telefono: '', email: '', observaciones: '',
      catalogoFalla: 'FKMX-CS', codigoFalla: '', descripcionFalla: ''
    });
  };

  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'serie') {
        const found = equipment.find(eq => eq.serie === value);
        if (found) { 
          newState.modelo = found.modelo || ''; 
          newState.descripcionEquipo = found.descripcion; 
          newState.cliente = found.cliente; 
        }
      }
      return newState;
    });
  };

  const submitReport = async () => {
    if (!reportForm.serie || !reportForm.falla) { setError("Campos de equipo y falla requeridos."); return; }
    setLoadingReport(true);
    try {
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'service_orders'), {
        ...reportForm, 
        status: 'Abierto', 
        createdAt: new Date().toISOString(), 
        createdBy: userId, 
        engineerName: loginForm.engineerName
      });

      if (GOOGLE_SHEETS_URL) {
        try {
          await fetch(GOOGLE_SHEETS_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...reportForm, action: 'CREATE', firebaseId: docRef.id, ESTATUS: 'Abierto' }) 
          });
        } catch (e) { console.error(e); }
      }
      setSheetOrders(prev => [{ id: docRef.id, ...reportForm, status: 'Abierto', createdAt: new Date().toISOString(), engineerName: loginForm.engineerName }, ...prev]);
      setMessage("ORDEN GENERADA.");
      setMenuSubScreen('dashboard');
    } catch (e) { setError(e.message); } finally { setLoadingReport(false); }
  };

  const fetchSpareParts = async (url, viewName) => {
    setLoadingSpares(true);
    setCurrentSparePartView(viewName);
    try {
      const response = await fetch(url);
      const text = await response.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = rows.slice(1).filter(r => r.trim()).map(row => {
        const values = []; let current = '', inQuote = false;
        for (let char of row) { if (char === '"') inQuote = !inQuote; else if (char === ',' && !inQuote) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; } else current += char; }
        values.push(current.trim().replace(/^"|"$/g, ''));
        const obj = {}; headers.forEach((h, i) => obj[h] = values[i] || '');
        return obj;
      });
      setSparePartsData(data);
    } catch (e) { setError("Error de carga."); } finally { setLoadingSpares(false); }
  };

  const renderContent = () => {
    switch (menuSubScreen) {
      case 'equipos':
        const filtered = equipment.filter(item => (item.serie + (item.modelo || '') + (item.cliente || '')).toLowerCase().includes(searchTerm.toLowerCase()));
        return (
          <div className="bg-white rounded-[2rem] shadow-sm border flex flex-col overflow-hidden animate-fadeIn">
            <div className="p-4 bg-gray-50 border-b sticky top-0 z-10"><input type="text" placeholder="Buscar..." className="w-full p-4 border rounded-2xl text-sm outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <div className="flex-1 overflow-auto text-xs min-h-[400px]">
              <table className="w-full">
                <thead className="bg-gray-50 font-black text-gray-400"><tr><th className="p-4 text-left">SERIE</th><th className="p-4 text-left">EQUIPO</th></tr></thead>
                <tbody className="divide-y text-left">
                  {filtered.map(item => (
                    <tr key={item.id} onClick={() => setSelectedEquipment(item)} className="hover:bg-blue-50 cursor-pointer">
                      <td className="p-4 font-mono font-black text-blue-600">{item.serie}</td>
                      <td className="p-4"><div className="font-black text-gray-800 uppercase text-[10px]">{item.modelo}</div><div className="text-[9px] text-gray-400 uppercase truncate">{item.cliente}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'reporteEquipos':
        return (
          <div className="grid gap-5 animate-fadeIn pb-20">
            <button onClick={() => setMenuSubScreen('ordenesAsignadas')} className="p-10 bg-white border-2 border-gray-100 rounded-[2.5rem] font-black text-gray-800 shadow-xl flex flex-col items-center gap-3">📋 MIS ÓRDENES</button>
            <button onClick={() => setShowResetOSConfirm(true)} className="p-10 bg-blue-600 rounded-[2.5rem] font-black text-white shadow-xl flex flex-col items-center gap-3">➕ NUEVA OS</button>
          </div>
        );

      case 'generarOS':
        return (
          <div className="p-6 bg-white border rounded-[2rem] overflow-y-auto animate-fadeIn text-left shadow-sm pb-20">
            <h3 className="text-2xl font-black mb-8 text-gray-800 uppercase tracking-tighter">Nueva Orden</h3>
            <Input label="Serie / SN" name="serie" value={reportForm.serie} onChange={handleReportChange} />
            <Input label="Modelo" name="modelo" value={reportForm.modelo} readOnly />
            <TextArea label="Falla Reportada" name="falla" value={reportForm.falla} onChange={handleReportChange} />
            <button onClick={() => setShowGenerateConfirm(true)} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl mt-8">Generar</button>
          </div>
        );

      case 'materialApoyo':
        if (documentationSubScreen === 'SPAREPARTS') {
          if (currentSparePartView) {
            return (
              <div className="flex flex-col bg-white border rounded-[2rem] overflow-hidden animate-fadeIn pb-20">
                <div className="p-5 bg-indigo-50 border-b flex items-center justify-between">
                  <button onClick={goBack} className="mr-4 w-8 h-8 flex items-center justify-center bg-white rounded-lg text-indigo-600 shadow-sm">←</button>
                  <h3 className="font-black text-indigo-900 uppercase text-xs">Refacciones: {currentSparePartView}</h3>
                </div>
                <div className="flex-1 overflow-auto p-2 min-h-[400px]">
                  {loadingSpares ? <div className="p-10">Cargando...</div> : (
                    <table className="w-full text-[9px] text-left border-collapse">
                      <tbody className="divide-y">
                        {sparePartsData.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="p-2">
                                {typeof val === 'string' && val.includes('drive.google.com') ? (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-gray-700 font-medium">{val.split('https://')[0]}</span>
                                    <img 
                                      src={`https://googleusercontent.com/profile/picture/6${val.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]}=w400`} 
                                      className="h-16 w-16 object-cover rounded-lg border bg-white" 
                                      onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error'; }}
                                    />
                                  </div>
                                ) : val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div className="p-6 bg-white border rounded-[2rem] animate-fadeIn pb-20">
               <button onClick={goBack} className="mb-8 flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px]"><span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">←</span> Volver</button>
               <div className="grid gap-4">
                 <button onClick={() => fetchSpareParts('https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=1919791847&single=true&output=csv', 'COMPOGUARD')} className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] font-black text-indigo-700 shadow-sm">⚖️ COMPOGUARD</button>
                 <button onClick={() => fetchSpareParts('https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=1546674811&single=true&output=csv', 'COMPOMAT G5')} className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] font-black text-indigo-700 shadow-sm">🗜️ COMPOMAT G5</button>
               </div>
            </div>
          );
        }
        return (
          <div className="p-2 flex flex-col animate-fadeIn pb-20">
            <div className="grid grid-cols-2 gap-3 pb-10">
              {['AMICUS', 'AMICORE', 'ALYX', 'COMPOGUARD'].map(k => (
                <button key={k} onClick={() => setDocumentationSubScreen(k)} className="p-6 bg-white border-2 border-gray-100 rounded-[2rem] text-[10px] font-black uppercase text-gray-700">📄 {k}</button>
              ))}
              <button onClick={() => setDocumentationSubScreen('SPAREPARTS')} className="p-6 bg-indigo-600 border-2 border-indigo-600 rounded-[2rem] text-[10px] font-black text-white col-span-2">🛠️ SPARE PARTS HUB</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b pb-5">
        {menuSubScreen === 'dashboard' ? (
          <div className="text-left"><span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Bienvenido</span><h2 className="font-black text-gray-800 uppercase text-xl">Ing. {loginForm.engineerName.split(' ')[1]}</h2></div>
        ) : (
          <div className="flex items-center gap-4"><button onClick={goBack} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black flex items-center justify-center">←</button><h2 className="font-black uppercase text-[10px] text-gray-300">{menuSubScreen}</h2></div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto pb-10">
        {menuSubScreen === 'dashboard' ? (
          <div className="grid gap-5 animate-fadeIn">
            <MenuButton label="Inventario" subScreenId="equipos" svgIcon={<EquiposSVG />} onClick={() => setMenuSubScreen('equipos')} />
            <MenuButton label="Reportes" subScreenId="reporteEquipos" svgIcon={<ReporteEquiposSVG />} onClick={() => setMenuSubScreen('reporteEquipos')} />
            <MenuButton label="Material" subScreenId="materialApoyo" svgIcon={<MaterialApoyoSVG />} onClick={() => setMenuSubScreen('materialApoyo')} />
            <MenuButton label="Agenda" subScreenId="contactos" svgIcon={<ContactosSVG />} onClick={() => setMenuSubScreen('contactos')} />
          </div>
        ) : renderContent()}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('landing');
  const [menuSubScreen, setMenuSubScreen] = useState('dashboard'); 
  const [documentationSubScreen, setDocumentationSubScreen] = useState(null);
  const [currentSparePartView, setCurrentSparePartView] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [sheetOrders, setSheetOrders] = useState([]); 
  const [registerForm, setRegisterForm] = useState({ engineerName: '', phone: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ engineerName: '', password: '' });

  // --- NAVEGACIÓN GLOBAL ---
  const navigate = (s, ms = 'dashboard', ds = null, csv = null) => {
    setScreen(s);
    setMenuSubScreen(ms);
    setDocumentationSubScreen(ds);
    setCurrentSparePartView(csv);
    window.history.pushState({ screen: s, menuSub: ms, docSub: ds, spareView: csv }, '');
  };

  const goBack = () => {
    window.history.back(); // <--- EL TRUCO ESTÁ AQUÍ
  };

  // --- CONTROL DEL BOTÓN ATRÁS (FÍSICO E INTERNO) ---
  useEffect(() => {
    window.history.replaceState({ screen: 'landing', menuSub: 'dashboard', docSub: null, spareView: null }, '');

    const handlePopState = (event) => {
      if (event.state) {
        const { screen, menuSub, docSub, spareView } = event.state;
        setScreen(screen);
        setMenuSubScreen(menuSub);
        setDocumentationSubScreen(docSub || null);
        setCurrentSparePartView(spareView || null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simulación de carga y auth (simplificado para el ejemplo)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-10 font-black text-blue-600">Cargando Fresenius Hub...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white p-7 rounded-[4rem] shadow-2xl relative min-h-[850px] flex flex-col">
        {error && <div className="bg-red-500 text-white p-4 rounded-2xl mb-4 font-black text-xs uppercase">{error}</div>}
        {message && <div className="bg-green-500 text-white p-4 rounded-2xl mb-4 font-black text-xs uppercase">{message}</div>}
        
        <div className="flex-1">
          {screen === 'landing' && <LandingScreen setScreen={(s) => navigate(s)} />}
          {screen === 'register' && <RegisterScreen form={registerForm} onChange={e => setRegisterForm({...registerForm, [e.target.name]: e.target.value})} goBack={goBack} />}
          {screen === 'login' && <LoginScreen form={loginForm} onChange={e => setLoginForm({...loginForm, [e.target.name]: e.target.value})} onSubmit={() => navigate('menu')} goBack={goBack} />}
          {screen === 'menu' && (
            <MenuScreen 
              menuSubScreen={menuSubScreen} setMenuSubScreen={(val) => navigate('menu', val)} 
              loginForm={loginForm} setScreen={(s) => navigate(s)} setMessage={setMessage} setError={setError} 
              userId={user?.uid} db={db} sheetOrders={sheetOrders} setSheetOrders={setSheetOrders} equipment={equipment} 
              documentationSubScreen={documentationSubScreen} setDocumentationSubScreen={(val) => navigate('menu', 'materialApoyo', val)}
              currentSparePartView={currentSparePartView} setCurrentSparePartView={(val) => navigate('menu', 'materialApoyo', 'SPAREPARTS', val)}
              goBack={goBack} navigate={navigate}
            />
          )}
        </div>
        <div className="mt-4 pt-4 border-t text-center"><p className="text-[7px] font-black text-gray-300 uppercase">FRESENIUS KABI • Engineering Hub 2026</p></div>
      </div>
    </div>
  );
}