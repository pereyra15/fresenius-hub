import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
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

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbz-uPHs1CcK9rYfFLhbAowobMB5iWcXVdUFYtRQ1Lw6xy7Y3Gcb2nVW502xqiKqiSH7Uw/exec"; 

const mockEngineers = [
  'WS06-JORGE VELAZQUEZ', 'WS07-EDGAR NUÑO', 'WS09-ZAHIRA ISLAS',
  'WS10-JUAN SAAVEDRA', 'WS11-JORGE DIAZ', 'WS12-HIRAM ALVAREZ', 'WS15-VICTOR ENRIQUEZ',
  'WSMG-DELFINO MUÑOZ', 'WSPL-CARLOS LUIS'
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

// --- COMPONENTES UI ---

const Input = ({ label, name, type = 'text', value, onChange, maxLength, inputMode, readOnly, placeholder, onFocus, onBlur, onClear }) => (
  <div className="mb-5 text-left relative">
    <label className="block text-gray-300 text-xs font-black mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <input
        className={`w-full p-4 ${onClear && value && !readOnly ? 'pr-12' : ''} border rounded-2xl text-base transition-all focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${readOnly ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' : 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'}`}
        type={type} name={name} value={value} onChange={onChange} maxLength={maxLength} 
        inputMode={inputMode} readOnly={readOnly} placeholder={placeholder}
        onFocus={onFocus} onBlur={onBlur} autoComplete="off"
      />
      {onClear && value && !readOnly && (
        <button type="button" onMouseDown={(e) => { e.preventDefault(); onClear(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 transition-colors z-10 font-bold text-lg">✕</button>
      )}
    </div>
  </div>
);

const TextArea = ({ label, name, value, onChange, rows = 3, placeholder, readOnly }) => (
  <div className="mb-5 text-left">
    <label className="block text-gray-300 text-xs font-black mb-1.5 uppercase tracking-wider">{label}</label>
    <textarea
      className={`w-full p-4 border rounded-2xl text-base transition-all focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${readOnly ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' : 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'}`}
      name={name} value={value || ''} onChange={onChange} rows={rows} placeholder={placeholder} readOnly={readOnly}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options, placeholder = "Seleccionar..." }) => (
  <div className="mb-5 text-left">
    <label className="block text-gray-300 text-xs font-black mb-1.5 uppercase tracking-wider">{label}</label>
    <select
      className={`w-full p-4 border rounded-2xl text-base bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none border-gray-600 ${value === '' ? 'text-gray-400' : 'text-white'}`}
      name={name} value={value} onChange={onChange}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);

const MenuButton = ({ label, subScreenId, svgIcon, setMenuSubScreen, menuSubScreen }) => {
  const isActive = menuSubScreen === subScreenId;
  return (
    <button
      onClick={() => setMenuSubScreen(subScreenId)}
      className={`flex items-center p-6 rounded-[1.5rem] transition-all transform hover:scale-[1.02] shadow-lg w-full border-2
        ${isActive ? 'bg-blue-600 text-white shadow-blue-400/20 border-blue-600' : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700'}`}
    >
      <div className={`mr-5 ${isActive ? 'text-white' : 'text-blue-400'}`}>
        <div className="w-10 h-10">{svgIcon}</div>
      </div>
      <span className="font-black text-xl text-left flex-1 tracking-tight">{label}</span>
      <div className={`ml-2 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
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
const AdministrativoSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11h.01M16 11h.01M8 11h.01M12 15h.01M16 15h.01M8 15h.01M21 21H3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16zM3 10h18"></path></svg>
);
const ContactosSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

// --- PANTALLAS ---

const LandingScreen = ({ setScreen }) => (
  <div className="flex flex-col gap-6 animate-fadeIn pb-10 mt-4">
    <div className="text-center mb-12">
      <img src="https://lh3.googleusercontent.com/d/1xl3VUyb0n-2wDlaBO06KRamI13PuWX8z" alt="Logo Hub" className="w-[100px] h-[100px] object-cover rounded-full mx-auto mb-6 shadow-sm bg-gray-800" />
      <h1 className="text-6xl font-black text-blue-400 tracking-tighter">FRESENIUS</h1>
      <p className="text-xs font-black text-gray-400 tracking-[0.4em] mt-3 uppercase">Engineering Hub</p>
    </div>
    <button onClick={() => setScreen('login')} className="p-8 bg-blue-600 rounded-[2.5rem] shadow-xl hover:bg-blue-700 transition-all group flex items-center gap-6">
      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg></div>
      <div className="text-left"><span className="block font-black text-white text-xl uppercase tracking-tight leading-none">Ingresar</span><span className="text-[11px] font-bold text-blue-200 uppercase tracking-widest mt-2">Acceso restringido</span></div>
    </button>
  </div>
);

const LoginScreen = ({ form, onChange, onSubmit, loading, setScreen }) => (
  <div className="animate-fadeIn pb-10">
    <div className="flex items-center gap-4 mb-10"><button onClick={() => setScreen('landing')} className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-600 text-xl">←</button><h2 className="text-3xl font-black text-white tracking-tighter uppercase">Ingreso</h2></div>
    <div className="space-y-2">
      <Select label="Seleccionar Ingeniero *" name="engineerName" value={form.engineerName} onChange={onChange} options={mockEngineers} />
      <Input label="PIN de Acceso *" name="password" type="password" value={form.password} onChange={onChange} maxLength={6} placeholder="••••••" />
      <button onClick={onSubmit} disabled={loading} className="w-full bg-blue-600 text-white text-lg font-black py-5 rounded-2xl mt-8 shadow-xl active:scale-95 transition-all uppercase disabled:opacity-50">{loading ? 'Verificando...' : 'Entrar'}</button>
      <p className="text-[10px] font-black text-gray-400 uppercase mt-4 text-center tracking-widest">* PIN e Ingeniero son obligatorios</p>
    </div>
  </div>
);

const MenuScreen = ({ 
  menuSubScreen, setMenuSubScreen, loginForm, setScreen, setMessage, setError, userId, db,
  contacts, addContact, deleteContact, serviceOrders, sheetOrders, setSheetOrders, equipment,
  documentationSubScreen, setDocumentationSubScreen, currentSparePartView, setCurrentSparePartView
}) => {
  const isSupervisor = ['WSMG-DELFINO MUÑOZ', 'WSPL-CARLOS LUIS'].includes(loginForm.engineerName);
  const contentScrollRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [sparePartsSearch, setSparePartsSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showResetOSConfirm, setShowResetOSConfirm] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '', unit: '', email: '' });
  const [selectedContact, setSelectedContact] = useState(null);
  
  const [sparePartsData, setSparePartsData] = useState([]);
  const [loadingSpares, setLoadingSpares] = useState(false);
  const [zoomedImageId, setZoomedImageId] = useState(null);
  
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [closingOrder, setClosingOrder] = useState(false);

  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const [reportForm, setReportForm] = useState({
    tipoOS: '', serie: '', modelo: '', descripcionEquipo: '', fechaSolicitud: new Date().toISOString().split('T')[0],
    ano: new Date().getFullYear().toString(), cliente: '', ingeniero: loginForm.engineerName || '',
    falla: '', area: '', reporta: '', contacto: '', telefono: '', email: '', observaciones: '',
    catalogoFalla: 'FKMX-CS', codigoFalla: '', descripcionFalla: ''
  });

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [menuSubScreen, documentationSubScreen, selectedOrderDetails, currentSparePartView]);

  const resetOSForm = () => {
    setReportForm({
      tipoOS: '', serie: '', modelo: '', descripcionEquipo: '', fechaSolicitud: new Date().toISOString().split('T')[0],
      ano: new Date().getFullYear().toString(), cliente: '', ingeniero: loginForm.engineerName || '',
      falla: '', area: '', reporta: '', contacto: '', telefono: '', email: '', observaciones: '',
      catalogoFalla: 'FKMX-CS', codigoFalla: '', descripcionFalla: ''
    });
  };

  const handleSmartBack = () => {
    if (selectedOrderDetails) {
      setSelectedOrderDetails(null);
    } else if (currentSparePartView) {
      setCurrentSparePartView(null);
    } else if (documentationSubScreen) {
      setDocumentationSubScreen(null);
    } else if (menuSubScreen === 'generarOS' || menuSubScreen === 'ordenesAsignadas' || menuSubScreen === 'administrativo') {
      setMenuSubScreen('dashboard');
    } else {
      setMenuSubScreen('dashboard');
    }
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

      if (name === 'reporta') {
        const val = value.toLowerCase();
        if (val.length > 0) {
          const matched = contacts.filter(c => 
            (c.name || '').toLowerCase().includes(val) || 
            (c.client || '').toLowerCase().includes(val)
          ).sort((a,b) => (a.name || '').trim().localeCompare((b.name || '').trim(), 'es', { sensitivity: 'base' }));
          
          setFilteredSuggestions(matched);
          setShowContactSuggestions(true);
        } else {
          setShowContactSuggestions(false);
        }
      }

      if (name === 'falla') {
        const text = value.toLowerCase();
        const match = fallaMapping.find(item => text.includes(item.key.toLowerCase()));
        if (match) { newState.codigoFalla = match.code; newState.descripcionFalla = match.desc; }
        else { newState.codigoFalla = 'FA43'; newState.descripcionFalla = 'TCT-Otro'; }
      }
      return newState;
    });
  };

  const selectContactSuggestion = (contact) => {
    setReportForm(prev => ({
      ...prev,
      reporta: contact.name,
      contacto: contact.name,
      telefono: contact.phone || '',
      email: contact.email || ''
    }));
    setShowContactSuggestions(false);
  };

  const submitReport = async () => {
    if (!reportForm.serie || !reportForm.falla) { setError("Campos de equipo y falla requeridos."); return; }
    setLoadingReport(true);
    try {
      // Nos aseguramos síncronamente de obtener el id de usuario activo
      const currentUserId = userId || auth.currentUser?.uid;
      if (!currentUserId) throw new Error("No hay sesión de usuario activa.");

      // Apuntamos directamente a la ruta raíz "service_orders"
      const docRef = await addDoc(collection(db, 'service_orders'), {
        ...reportForm, 
        status: 'Abierto', 
        createdAt: new Date().toISOString(), 
        createdBy: currentUserId, 
        engineerName: reportForm.ingeniero 
      });

      // --- NUEVA LÓGICA DE CORREO DINÁMICO ---
      // Calculamos dinámicamente el correo basado en el ingeniero seleccionado en el reporte,
      // para que funcione tanto para ingenieros normales como para supervisores asignando a otros.
      const parts = reportForm.ingeniero.split('-');
      const namePart = parts.length > 1 ? parts[1].trim() : reportForm.ingeniero.trim();
      
      const cleanName = namePart
        .toLowerCase()
        .replace(/ñ/g, 'n')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ".");
        
      const engineerEmail = `${cleanName}@fresenius-kabi.com`;
      // ----------------------------------------

      if (GOOGLE_SHEETS_URL) {
        try {
          await fetch(GOOGLE_SHEETS_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                ...reportForm, 
                action: 'CREATE',      
                firebaseId: docRef.id, 
                ESTATUS: 'Abierto',
                engineerEmail: engineerEmail // Enviamos el correo correcto al Apps Script
            }) 
          });
        } catch (e) { console.error("Sheet Sync Failed:", e); }
      }

      const novaMendo = {
        id: docRef.id,
        ...reportForm,
        status: 'Abierto',
        createdAt: new Date().toISOString(),
        engineerName: reportForm.ingeniero 
      };
      setSheetOrders(prev => [novaMendo, ...prev]);

      setMessage("ORDEN GENERADA Y NOTIFICADA.");
      setMenuSubScreen('dashboard');
    } catch (e) { setError("Fallo al guardar reporte: " + e.message); }
    finally { setLoadingReport(false); }
  };

  const closeOrder = async (order) => {
    setClosingOrder(true);
    setSheetOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cerrado' } : o));
    setSelectedOrderDetails(prev => ({ ...prev, status: 'Cerrado' }));

    try {
      if (order.id && !String(order.id).startsWith('sheet-')) {
        // Aseguramos que la actualización de estado también apunte a la ruta raíz
        const orderRef = doc(db, 'service_orders', order.id);
        try {
          await updateDoc(orderRef, { status: 'Cerrado', closedAt: new Date().toISOString() });
        } catch (firebaseErr) {
          console.warn("El documento no se encontró en la base de datos de Firebase.", firebaseErr);
        }
      }
      
      if (GOOGLE_SHEETS_URL) {
        try {
          await fetch(GOOGLE_SHEETS_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
              action: 'UPDATE',      
              firebaseId: order.id,  
              ESTATUS: 'Cerrado'     
            }) 
          });
        } catch (e) { console.error("Sheet Update Sync Failed:", e); }
      }

      setMessage("ORDEN FINALIZADA Y SINCRONIZADA.");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      console.error(e);
      setError("Cerrado localmente. Error general al sincronizar.");
    } finally {
      setClosingOrder(false);
    }
  };

  const fetchSpareParts = async (url, viewName) => {
    setLoadingSpares(true);
    setCurrentSparePartView(viewName);
    setSparePartsSearch('');
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`);
      const text = await response.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = rows.slice(1).filter(r => r.trim()).map((row, idx) => {
        const values = []; let current = '', inQuote = false;
        for (let char of row) { if (char === '"') inQuote = !inQuote; else if (char === ',' && !inQuote) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; } else current += char; }
        values.push(current.trim().replace(/^"|"$/g, ''));
        const obj = {}; headers.forEach((h, i) => obj[h] = values[i] || '');
        Object.defineProperty(obj, '_id', { value: idx, enumerable: false });
        return obj;
      });
      const sortedData = data.sort((a,b) => {
        const keyA = String(Object.values(a)[1] || '').trim();
        const keyB = String(Object.values(b)[1] || '').trim();
        return keyA.localeCompare(keyB, 'es', { sensitivity: 'base', numeric: true });
      });
      setSparePartsData(sortedData);
    } catch (e) { setError("Fallo en sincronización de repuestos."); }
    finally { setLoadingSpares(false); }
  };

  const handleSaveContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.unit || !newContact.email) {
      setError("TODOS LOS CAMPOS DE LA AGENDA SON OBLIGATORIOS.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    try {
      await addContact({...newContact, client: newContact.unit, role: 'Contacto'});
      setNewContact({name:'', phone:'', unit:'', email:''});
      setShowAddContactForm(false);
      setMessage("CONTACTO GUARDADO.");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setError("Error al guardar contacto.");
    }
  };

  // --- LÓGICA DE ALINEACIÓN DE COLUMNAS (REPARADA PARA MOSTRAR TODO EL TEXTO) ---
  const getColWidthClass = (headerKey) => {
    const key = headerKey.toLowerCase();
    // Identifica columnas de código/parte para ancho fijo pero permitiendo ajuste si es necesario
    if (key.includes('parte') || key.includes('no') || key.includes('cod')) return "w-[90px] shrink-0";
    // Identifica columnas de imagen
    if (key.includes('imagen') || key.includes('foto') || key.includes('drive')) return "w-[80px] shrink-0 text-center justify-center";
    // El resto toma el espacio flexible
    return "flex-1 min-w-0";
  };

  const renderContent = () => {
    switch (menuSubScreen) {
      case 'equipos':
        const filtered = (equipment || []).filter(item => {
          const eng = (loginForm.engineerName || '').toLowerCase().replace(/[\s-]/g, '');
          const resp = (item.responsable || '').toLowerCase().replace(/[\s-]/g, '');
          const matchEng = isSupervisor ? true : (eng.includes(resp) || resp.includes(eng));
          const matchTerm = (item.serie + (item.modelo || '') + (item.descripcion || '') + (item.cliente || '')).toLowerCase().includes(searchTerm.toLowerCase());
          return matchEng && matchTerm;
        }).sort((a, b) => {
          const hospitalA = (a.cliente || '').trim();
          const hospitalB = (b.cliente || '').trim();
          const hospitalComp = hospitalA.localeCompare(hospitalB, 'es', { sensitivity: 'base' });
          if (hospitalComp !== 0) return hospitalComp;
          return (a.serie || '').trim().localeCompare((b.serie || '').trim(), 'es', { sensitivity: 'base', numeric: true });
        });

        return (
          <div className="bg-gray-800 rounded-[2rem] shadow-sm border border-gray-700 flex flex-col animate-fadeIn relative">
            <div className="sticky top-0 z-50 bg-gray-900 rounded-t-[2rem] border-b border-gray-700 shadow-md">
              <div className="p-4 border-b border-gray-700">
                <div className="relative">
                  <input type="text" placeholder="Buscar por Serie, Descripción o Hospital..." className={`w-full p-4 ${searchTerm ? 'pr-12' : ''} border border-gray-600 bg-gray-700 text-white rounded-2xl text-base outline-none focus:ring-2 focus:ring-blue-500 shadow-sm`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 transition-colors font-bold text-lg">✕</button>
                  )}
                </div>
              </div>
              <div className="flex px-2 font-black text-gray-400 text-[10px] uppercase tracking-wider">
                <div className="py-4 px-2 w-[110px] shrink-0 text-left">SERIE</div>
                <div className="py-4 px-2 flex-1 text-left">EQUIPO / HOSPITAL</div>
                <div className="py-4 px-2 w-12 shrink-0 text-center">ST</div>
              </div>
            </div>
            <div className="flex-1 text-xs min-h-[400px] flex flex-col divide-y divide-gray-700 bg-gray-800 rounded-b-[2rem] text-left">
              {filtered.length > 0 ? filtered.map(item => (
                <div key={item.id || item.serie} onClick={() => setSelectedEquipment(item)} className="flex px-2 hover:bg-gray-700 cursor-pointer transition-colors active:bg-gray-600 last:rounded-b-[2rem]">
                  <div className="py-4 px-2 w-[110px] shrink-0 font-mono font-black text-blue-400 text-[11px] truncate self-center">
                    {item.serie}
                  </div>
                  <div className="py-4 px-2 flex-1 overflow-hidden self-center">
                    <div className="font-black text-white uppercase text-[10px] truncate leading-tight">
                      {item.descripcion || 'SIN DESCRIPCIÓN'}
                    </div>
                    <div className="text-[9px] text-blue-300 font-black uppercase tracking-tighter truncate mt-0.5">
                      {item.cliente}
                    </div>
                  </div>
                  <div className="py-4 px-2 w-12 shrink-0 text-center text-lg self-center">
                    {sheetOrders.some(so => so.serie === item.serie && so.status?.toLowerCase().includes('abierto')) ? '🔴' : '🟢'}
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center font-bold text-gray-500 uppercase">Sin equipos asignados</div>
              )}
            </div>
          </div>
        );

      case 'reporteEquipos':
        return (
          <div className="grid gap-6 animate-fadeIn pb-20">
            <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 mb-2">
              <h4 className="font-black text-blue-300 text-sm uppercase tracking-widest mb-2">Métricas Rápidas</h4>
              <div className="flex gap-4">
                <div className="flex-1"><span className="block text-3xl font-black text-white">{sheetOrders.filter(so => {
                  const eng = (loginForm.engineerName || '').toLowerCase().replace(/[\s-]/g, '');
                  const orderEng = (so.engineerName || '').toLowerCase().replace(/[\s-]/g, '');
                  return eng === orderEng && so.status && so.status.toLowerCase().includes('abierto');
                }).length}</span><span className="text-[10px] font-black text-blue-400 uppercase">Abiertas</span></div>
                <div className="flex-1"><span className="block text-3xl font-black text-green-400">{sheetOrders.filter(so => {
                  const eng = (loginForm.engineerName || '').toLowerCase().replace(/[\s-]/g, '');
                  const orderEng = (so.engineerName || '').toLowerCase().replace(/[\s-]/g, '');
                  return eng === orderEng && so.status && so.status.toLowerCase().includes('cerrado');
                }).length}</span><span className="text-[10px] font-black text-green-500 uppercase">Cerradas</span></div>
              </div>
            </div>
            <button onClick={() => setMenuSubScreen('ordenesAsignadas')} className="p-10 bg-gray-800 border-2 border-gray-700 rounded-[2.5rem] font-black text-white text-xl shadow-xl flex flex-col items-center gap-3 active:scale-95 transition-all"><span className="text-6xl">📋</span> MIS ÓRDENES</button>
            <button onClick={() => setShowResetOSConfirm(true)} className="p-10 bg-blue-600 rounded-[2.5rem] font-black text-white text-xl shadow-xl flex flex-col items-center gap-3 active:scale-95 transition-all"><span className="text-6xl">➕</span> NUEVA OS</button>
          </div>
        );

      case 'generarOS':
        return (
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-[2rem] overflow-y-auto animate-fadeIn text-left shadow-sm pb-20">
            <h3 className="text-3xl font-black mb-8 text-white tracking-tighter border-b border-gray-700 pb-4 uppercase">Nueva Orden</h3>
            {isSupervisor ? (
              <Select label="Ingeniero Asignado *" name="ingeniero" value={reportForm.ingeniero} onChange={handleReportChange} options={mockEngineers} />
            ) : (
              <Input label="Ingeniero Asignado" name="ingeniero" value={reportForm.ingeniero} readOnly />
            )}
            <Select label="Tipo de Servicio" name="tipoOS" value={reportForm.tipoOS} onChange={handleReportChange} options={['ZMXC', 'ZMXP', 'ZMXI', 'ZMXA']} />
            <Input label="Serie / SN" name="serie" value={reportForm.serie} onChange={handleReportChange} />
            <Input label="Modelo" name="modelo" value={reportForm.modelo} onChange={handleReportChange} readOnly />
            <Input label="Descripción del Equipo" name="descripcionEquipo" value={reportForm.descripcionEquipo} onChange={handleReportChange} readOnly />
            <Input label="Hospital" name="cliente" value={reportForm.cliente} onChange={handleReportChange} readOnly />
            <Select label="Área" name="area" value={reportForm.area} onChange={handleReportChange} options={['Recolección', 'Fraccionamiento', 'Aféresis']} />
            <TextArea label="Falla Reportada" name="falla" value={reportForm.falla} onChange={handleReportChange} />
            <div className="relative">
              <Input label="Reporta" name="reporta" value={reportForm.reporta} onChange={handleReportChange} onClear={() => { setReportForm(prev => ({...prev, reporta: ''})); setShowContactSuggestions(false); }} onFocus={() => { if(reportForm.reporta.length > 0) setShowContactSuggestions(true); }} placeholder="Busca por nombre u hospital..." />
              {showContactSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-[110] top-[85px] left-0 right-0 bg-gray-700 border border-gray-600 rounded-2xl shadow-2xl max-h-[220px] overflow-y-auto animate-fadeIn">
                  {filteredSuggestions.map((c, idx) => (
                    <div key={c.id || idx} onMouseDown={() => selectContactSuggestion(c)} className="p-4 border-b border-gray-600 last:border-0 hover:bg-blue-600 cursor-pointer active:bg-blue-700 transition-colors">
                      <p className="font-black text-white text-sm uppercase leading-tight">{c.name}</p>
                      <p className="text-[10px] text-blue-300 font-bold uppercase mt-1 tracking-tighter">{c.client}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Input label="Teléfono" name="telefono" value={reportForm.telefono} onChange={handleReportChange} />
            <Input label="Correo Electrónico" name="email" type="email" value={reportForm.email} onChange={handleReportChange} placeholder="correo@ejemplo.com" />
            <TextArea label="Observaciones" name="observaciones" value={reportForm.observaciones} onChange={handleReportChange} rows={2} />
            <button onClick={() => setShowGenerateConfirm(true)} disabled={loadingReport} className="w-full bg-green-600 text-white text-lg font-black py-5 rounded-2xl mt-8 shadow-xl hover:bg-green-700 active:scale-95 transition-all uppercase">{loadingReport ? 'Enviando...' : 'Generar Reporte'}</button>
          </div>
        );

      case 'contactos':
        const filteredContacts = contacts
          .filter(c => {
            const term = contactSearch.toLowerCase();
            return (c.name || '').toLowerCase().includes(term) || (c.client || '').toLowerCase().includes(term) || (c.phone || '').toLowerCase().includes(term);
          })
          .sort((a, b) => (a.name || '').trim().localeCompare((b.name || '').trim(), 'es', { sensitivity: 'base' }));
        return (
          <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-[2rem] animate-fadeIn relative">
            <div className="sticky top-0 z-50 bg-gray-900 rounded-t-[2rem] border-b border-gray-700 shadow-md">
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black text-purple-300 tracking-tight uppercase">Agenda</h3>{!showAddContactForm && (<button onClick={() => setShowAddContactForm(true)} className="bg-purple-600 text-white text-[11px] font-black py-2 px-5 rounded-full shadow-lg active:scale-90 transition-all uppercase">Nuevo+</button>)}</div>
                {!showAddContactForm && (
                  <div className="relative">
                    <input type="text" placeholder="Buscar nombre, hospital o número..." className={`w-full p-4 ${contactSearch ? 'pr-12' : ''} border border-gray-600 bg-gray-700 text-white rounded-2xl text-base outline-none focus:ring-2 focus:ring-purple-500 shadow-sm`} value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
                    {contactSearch && (
                      <button onClick={() => setContactSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 transition-colors font-bold text-lg">✕</button>
                    )}
                  </div>
                )}
                {showAddContactForm && (
                  <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl animate-slideDown max-h-[500px] overflow-y-auto mt-2">
                    <div className="flex justify-between items-center mb-6 text-left uppercase"><h4 className="text-xs font-black text-purple-400">Registro Clínico</h4><button className="text-gray-300 hover:text-white text-xl" onClick={() => setShowAddContactForm(false)}>✕</button></div>
                    <div className="space-y-4">
                        <Input label="Nombre Completo" placeholder="NOMBRE" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                        <Input label="Teléfono" placeholder="TELÉFONO" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                        <Input label="Hospital / Unidad" placeholder="HOSPITAL" value={newContact.unit} onChange={e => setNewContact({...newContact, unit: e.target.value})} />
                        <Input label="Correo Electrónico" placeholder="EMAIL" type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                        <button onClick={handleSaveContact} className="w-full bg-purple-600 text-white text-lg font-black py-4 rounded-xl uppercase shadow-md active:scale-95 transition-all mt-4">Guardar Contacto</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 p-5 space-y-4 min-h-[400px] bg-gray-800 rounded-b-[2rem]">
              {filteredContacts.length > 0 ? filteredContacts.map(c => (
                <div key={c.id} onClick={() => setSelectedContact(c)} className="p-6 border-l-[12px] border-l-purple-500 border border-gray-700 rounded-[1.5rem] bg-gray-800 text-left group shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-700 active:scale-[0.98] transition-all">
                  <div className="flex-1"><p className="font-black text-white text-base uppercase leading-tight">{c.name}</p><p className="text-[11px] text-gray-400 font-bold uppercase mt-1 leading-tight">{c.client}</p></div>
                  <button onClick={(e) => { e.stopPropagation(); setContactToDelete(c); }} className="text-red-400 bg-red-900/50 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-red-900 text-lg shrink-0">✕</button>
                </div>
              )) : (<div className="p-10 text-center font-bold text-gray-500 uppercase tracking-widest text-xs">Sin resultados</div>)}
            </div>
          </div>
        );

      case 'administrativo':
        const adminLinks = [{ t: 'PILARES ESTRATEGICOS', l: 'https://drive.google.com/file/d/1VdlSdTz8pgqd4JI3g9i0V7UUR0PFtmig/view?usp=sharing' }, { t: 'OGST NUEVOS PROYECTOS DE EFICIENCIA', l: 'https://drive.google.com/file/d/1glBnT_KCVZzCDu23NA4Qck1VyqT-xtq4/view?usp=sharing' }, { t: 'OGST OBJETIVOS FINANCIEROS TS', l: 'https://drive.google.com/file/d/1uSQMhv7aWhorQUQjQ0IbAzXxs6XUoyM-/view?usp=drive_link' }];
        return (
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-[2rem] animate-fadeIn pb-20 text-left shadow-sm">
            <h3 className="text-3xl font-black mb-8 text-white tracking-tighter border-b border-gray-700 pb-4 uppercase">Administrativo</h3>
            <div className="grid gap-4">
              {adminLinks.map((d, i) => (
                <button key={i} onClick={() => window.open(d.l, '_blank')} className="p-6 bg-gray-700 border-2 border-gray-600 rounded-2xl font-black text-blue-300 text-left hover:bg-gray-600 transition-all flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-blue-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg></div>
                  <div className="flex flex-col flex-1"><span className="text-sm md:text-base uppercase tracking-tight leading-tight text-gray-100 font-black">{d.t}</span></div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'materialApoyo':
        if (documentationSubScreen === 'SPAREPARTS') {
          if (currentSparePartView) {
            const filteredSpareParts = sparePartsData.filter(row => {
              const term = sparePartsSearch.toLowerCase();
              return Object.values(row).some(val => String(val).toLowerCase().includes(term));
            });

            return (
              <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-[2rem] animate-fadeIn relative pb-4">
                <div className="sticky top-0 z-50 bg-gray-900 rounded-t-[2rem] border-b border-gray-700 shadow-md">
                  <div className="p-5 border-b border-gray-700 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button onClick={() => { setCurrentSparePartView(null); setSparePartsSearch(''); }} className="mr-4 w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg text-indigo-400 hover:bg-gray-600 shadow-sm text-lg">←</button>
                        <h3 className="font-black text-indigo-300 tracking-tight uppercase text-sm">Refacciones: {currentSparePartView}</h3>
                      </div>
                    </div>
                    <div className="relative w-full">
                      <input type="text" placeholder="Buscar refacción (ej. número de parte o descripción)..." className={`w-full p-4 ${sparePartsSearch ? 'pr-12' : ''} border border-gray-600 bg-gray-700 text-white rounded-2xl text-base outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm`} value={sparePartsSearch} onChange={e => setSparePartsSearch(e.target.value)} />
                      {sparePartsSearch && (
                        <button onClick={() => setSparePartsSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 transition-colors font-bold text-lg">✕</button>
                      )}
                    </div>
                  </div>
                  {sparePartsData[0] && (
                    <div className="flex w-full px-2 text-[10px]">
                      {Object.keys(sparePartsData[0]).map(k => (
                        <div key={k} className={`p-3 font-black text-gray-400 uppercase tracking-tighter text-left ${getColWidthClass(k)}`}>
                          {k}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col min-h-[400px] text-[10px] divide-y divide-gray-700 bg-gray-800 rounded-b-[2rem]">
                  {loadingSpares ? (
                    <div className="text-center p-20 animate-pulse text-indigo-400 font-black">Cargando catálogo...</div>
                  ) : (
                    filteredSpareParts.length > 0 ? filteredSpareParts.map((row) => (
                      <div key={row._id} className="flex w-full px-2 hover:bg-gray-700 transition-colors items-center py-4">
                        {Object.keys(sparePartsData[0]).map((k, j) => {
                          const val = row[k] || '';
                          return (
                            <div key={j} className={`p-3 flex items-center text-gray-200 break-words leading-relaxed font-bold ${getColWidthClass(k)}`}>
                              {typeof val === 'string' && val.includes('drive.google.com') ? (
                                <div className="relative group w-14 h-14 mx-auto shrink-0">
                                  {(() => {
                                    const idMatch = val.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                    const driveId = idMatch ? idMatch[1] : null;
                                    return driveId ? (
                                      <img key={driveId} src={`https://googleusercontent.com/profile/picture/6${driveId}=w400`} className="h-full w-full object-cover rounded-lg border border-gray-600 shadow-sm cursor-pointer bg-gray-800" alt="Refacción" onError={(e) => { if (!e.target.dataset.triedBackup) { e.target.dataset.triedBackup = "true"; e.target.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`; } else { e.target.src = 'https://placehold.co/100x100?text=Error'; } }} onClick={() => setZoomedImageId(driveId)} />
                                    ) : <span className="text-[8px] text-red-400">N/A</span>;
                                  })()}
                                </div>
                              ) : (
                                <span className="text-gray-200 block w-full whitespace-normal">{val}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )) : (
                      <div className="p-10 text-center font-bold text-indigo-400 uppercase tracking-widest text-xs">Sin resultados</div>
                    )
                  )}
                </div>
              </div>
            );
          }
          return (
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-[2rem] animate-fadeIn pb-20">
                <button onClick={() => setDocumentationSubScreen(null)} className="mb-8 flex items-center gap-3 text-indigo-400 font-black uppercase text-xs tracking-widest hover:text-indigo-300"><span className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-lg">←</span> Volver</button>
                <div className="grid gap-5">
                  <button onClick={() => fetchSpareParts('https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=1919791847&single=true&output=csv', 'COMPOGUARD')} className="p-8 bg-gray-700 border-2 border-gray-600 rounded-[2rem] font-black text-indigo-300 hover:bg-gray-600 transition-all flex flex-col items-center gap-3 shadow-sm text-lg"><span className="text-4xl">⚖️</span> COMPOGUARD</button>
                  <button onClick={() => fetchSpareParts('https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=1546674811&single=true&output=csv', 'COMPOMAT G5')} className="p-8 bg-gray-700 border-2 border-gray-600 rounded-[2rem] font-black text-indigo-300 hover:bg-gray-600 transition-all flex flex-col items-center gap-3 shadow-sm text-lg"><span className="text-4xl">🗜️</span> COMPOMAT G5</button>
                </div>
            </div>
          );
        }

        const docLinks = {
          'AMICUS': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/138n35pCNjruPm8z3rDk7sMwA3k_gKrml/view?usp=drive_link' }, { t: 'Manual de Usuario', l: 'https://drive.google.com/file/d/1c8SfUfoQj4-S2drwPnu_oaQ27dokE5vB/view?usp=drive_link' }, { t: 'Refacciones (Drive)', l: 'https://drive.google.com/file/d/1cU2WsOrFLMKeJWace-BmuILhGAGsaZdS/view?usp=drive_link' }],
          'AMICORE': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1SRK9tx68JT3OSvjboQWkIqnKVvKVU0Kx/view?usp=drive_link' }, { t: 'Manual de Usuario', l: 'https://drive.google.com/file/d/1YXtiWsgCIo95uaS6oPMfkPTqu_avXCc0/view?usp=drive_link' }],
          'ALYX': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1EbFMtnovi4Qs-D_Kk9LOa2sq74rFB6Hr/view?usp=drive_link' }, { t: 'Guía Alyx Service Software', l: 'https://drive.google.com/file/d/1zOIT89IvMo2kAKUf7ZJWn8F6-Y1f_bJR/view?usp=drive_link' }],
          'COMPOMAT G5': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1Rzm1Iso5UIv3zVc4ue6ml0Xv2cJ1bkS5/view?usp=drive_link' }],
          'COMPOGUARD': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1QWjsUoxtVbh49-rUUXhGXrRrNwt3_5F0/view?usp=drive_link' }],
          'COMPOSEAL': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1DPSHF4bVJTLGn2or6DaDBQRsTi5hkxwC/view?usp=drive_link' }],
          'COMPODOCK': [{ t: 'Manual de Servicio Técnico', l: 'https://drive.google.com/file/d/1J4I1RhEpE3SGb1jclwoRtHwubTA8zbPE/view?usp=drive_link' }]
        };

        if (documentationSubScreen && docLinks[documentationSubScreen]) {
          return (
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-[2rem] text-left animate-fadeIn shadow-sm pb-20">
              <button onClick={() => setDocumentationSubScreen(null)} className="mb-8 flex items-center gap-3 text-blue-400 font-black uppercase text-xs tracking-widest hover:text-blue-300"><span className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-lg">←</span> Volver</button>
              <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase text-white border-b border-gray-700 pb-4">{documentationSubScreen} Docs</h3>
              <div className="grid gap-4">
                {docLinks[documentationSubScreen].map(d => (
                  <button key={d.t} onClick={() => window.open(d.l, '_blank')} className="p-6 bg-gray-700 border-2 border-gray-600 rounded-2xl font-black text-blue-300 text-left hover:bg-gray-600 transition-all flex items-center gap-4">
                    <span className="text-2xl">📄</span><span className="text-xs uppercase tracking-tighter leading-tight text-gray-200">{d.t}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className="p-2 flex flex-col animate-fadeIn pb-20">
            <div className="grid grid-cols-2 gap-4 pb-10">
              {Object.keys(docLinks).map(k => (
                <button key={k} onClick={() => setDocumentationSubScreen(k)} className="p-6 bg-gray-800 border-2 border-gray-700 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-gray-200 shadow-sm hover:border-blue-500 transition-all flex flex-col items-center gap-4 active:scale-95">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-blue-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg></div>
                  {k}
                </button>
              ))}
              <button onClick={() => setDocumentationSubScreen('SPAREPARTS')} className="p-6 bg-indigo-600 border-2 border-indigo-600 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-indigo-700 transition-all flex flex-col items-center gap-4 col-span-2 active:scale-95">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                🛠️ SPARE PARTS HUB
              </button>
            </div>
          </div>
        );

      case 'ordenesAsignadas':
        const myOrders = sheetOrders.filter(so => {
          const eng = (loginForm.engineerName || '').toLowerCase().replace(/[\s-]/g, '');
          const orderEng = (so.engineerName || '').toLowerCase().replace(/[\s-]/g, '');
          return eng === orderEng;
        });
        if (selectedOrderDetails) {
          const so = selectedOrderDetails;
          return (
            <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-[2rem] animate-fadeIn pb-20 shadow-sm text-left">
              <div className="p-6 bg-gray-900 border-b border-gray-700 flex items-center sticky top-[-1px] z-50 rounded-t-[2rem]"><button onClick={() => setSelectedOrderDetails(null)} className="mr-5 w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg text-blue-400 hover:bg-gray-600 shadow-sm text-lg">←</button><h3 className="font-black text-blue-300 tracking-tight uppercase text-sm">Detalle de Orden</h3></div>
              <div className="p-6 space-y-6 min-h-[500px]">
                <div className="flex justify-between items-start"><div><p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Servicio</p><p className="text-2xl font-black text-white tracking-tighter mt-1">{so.tipoOS}</p></div><span className={`text-[11px] font-black px-4 py-2 rounded-xl shadow-sm ${(so.status && so.status.toLowerCase().includes('abierto')) ? 'bg-orange-900/50 text-orange-400' : 'bg-green-900/50 text-green-400'}`}>{so.status ? (so.status.toLowerCase().includes('abierto') ? 'ABIERTO' : 'CERRADO') : 'ABIERTO'}</span></div>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-5"><div><p className="text-[9px] font-black text-gray-500 uppercase">Serie / SN</p><p className="text-sm font-black text-gray-200 mt-1">{so.serie}</p></div><div><p className="text-[9px] font-black text-gray-500 uppercase">Modelo</p><p className="text-sm font-black text-gray-200 mt-1">{so.modelo || 'N/A'}</p></div><div className="col-span-2"><p className="text-[9px] font-black text-gray-500 uppercase">Descripción</p><p className="text-sm font-black text-gray-200 mt-1">{so.descripcionEquipo || so.descripcion || 'No especificada'}</p></div></div>
                <div className="border-t border-gray-700 pt-5"><p className="text-[9px] font-black text-gray-500 uppercase">Hospital / Unidad</p><p className="text-sm font-black text-white mt-1">{so.cliente}</p></div>
                <div className="bg-gray-700 p-5 rounded-2xl border border-gray-600"><p className="text-[9px] font-black text-gray-400 uppercase mb-2">Falla Reportada</p><p className="text-xs font-bold text-gray-200 leading-relaxed italic">"{so.falla}"</p>{(so.codigoFalla || so.descripcionFalla) && (<p className="mt-3 text-[11px] font-black text-blue-400">{so.codigoFalla} {so.descripcionFalla}</p>)}</div>
                <div className="border-t border-gray-700 pt-5 space-y-4"><p className="text-[9px] font-black text-gray-500 uppercase">Datos de Contacto</p><div className="flex items-center gap-4"><span className="text-base">👤</span><p className="text-xs font-bold text-gray-200">{so.reporta || 'No especificado'}</p></div><div className="flex items-center gap-4"><span className="text-base">📞</span><p className="text-xs font-bold text-blue-400 font-mono">{so.telefono || 'Sin teléfono'}</p></div><div className="flex items-center gap-4"><span className="text-base">✉️</span><p className="text-[11px] font-bold text-gray-400">{so.email || 'Sin correo'}</p></div></div>
                {so.observaciones && (<div className="border-t border-gray-700 pt-5"><p className="text-[9px] font-black text-gray-500 uppercase mb-2">Observaciones</p><p className="text-[11px] font-bold text-gray-300 leading-relaxed">{so.observaciones}</p></div>)}
                <div className="border-t border-gray-700 pt-5 text-center"><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Generado el {so.createdAt ? so.createdAt : 'Desconocido'}</p></div>
                {(so.status && so.status.toLowerCase().includes('abierto')) && (<div className="pt-8"><button onClick={() => closeOrder(so)} disabled={closingOrder} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all uppercase flex items-center justify-center gap-3 text-lg">{closingOrder ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>PROCESANDO...</>) : (<><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Cerrar Orden</>)}</button></div>)}
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-[2rem] animate-fadeIn pb-20 shadow-sm">
            <div className="p-6 bg-gray-900 border-b border-gray-700 sticky top-[-1px] z-50 rounded-t-[2rem]"><h3 className="text-lg font-black text-blue-300 tracking-tight uppercase">Historial de Órdenes</h3></div>
            <div className="flex-1 p-5 space-y-4 min-h-[400px]">
              {myOrders.length > 0 ? myOrders.map(so => (
                <div key={so.id} onClick={() => setSelectedOrderDetails(so)} className="p-6 border-l-[12px] border-l-blue-500 border border-gray-700 rounded-[1.5rem] bg-gray-800 text-left relative shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:bg-gray-700 hover:border-blue-800/50">
                  <div className="flex justify-between items-start"><p className="font-black text-blue-400 text-base">{so.tipoOS}</p><span className={`text-[9px] font-black px-3 py-1.5 rounded-lg shadow-sm ${(so.status && so.status.toLowerCase().includes('abierto')) ? 'bg-orange-900/50 text-orange-400' : 'bg-green-900/50 text-green-400'}`}>{so.status ? (so.status.toLowerCase().includes('abierto') ? 'ABIERTO' : 'CERRADO') : 'ABIERTO'}</span></div>
                  <p className="font-black text-white text-xs mt-3">{so.serie} - {so.modelo || 'EQUIPO'}</p><p className="text-[11px] text-gray-400 uppercase tracking-tight truncate max-w-[220px] mt-1">{so.cliente}</p><div className="mt-5 flex justify-end"><span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Ver Detalles →</span></div>
                </div>
              )) : <div className="p-10 text-center font-bold text-gray-500 uppercase tracking-widest text-[11px]">Sin órdenes registradas</div>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full relative h-full flex flex-col" onClick={() => setShowContactSuggestions(false)}>
      <div className="flex justify-between items-center mb-8 border-b-2 border-gray-700 pb-5">
        {menuSubScreen === 'dashboard' ? (
          <div className="flex flex-col text-left"><span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Bienvenido</span><h2 className="font-black text-white tracking-tighter uppercase text-3xl leading-none mt-1">Ing. {loginForm.engineerName.split(' ')[2] || loginForm.engineerName.split(' ')[1]}</h2></div>
        ) : (
          <div className="flex items-center gap-4">
            <button onClick={handleSmartBack} className="w-12 h-12 rounded-xl bg-gray-700 text-blue-400 hover:bg-gray-600 font-black flex items-center justify-center shadow-sm active:scale-90 transition-all text-xl">←</button>
            <h2 className="font-black uppercase text-xs tracking-widest text-gray-400">{menuSubScreen}</h2>
          </div>
        )}
        {menuSubScreen === 'dashboard' && (<button onClick={() => setScreen('landing')} className="w-12 h-12 flex items-center justify-center bg-gray-700 text-red-400 rounded-xl active:bg-gray-600 hover:bg-gray-600 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg></button>)}
      </div>
      <div ref={contentScrollRef} className="flex-1 overflow-y-auto scroll-smooth pb-10 overscroll-none overflow-x-hidden">
        {menuSubScreen === 'dashboard' ? (
          <div className="grid gap-6 animate-fadeIn">
            <MenuButton label="Inventario" subScreenId="equipos" svgIcon={<EquiposSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} />
            <MenuButton label="Reportes" subScreenId="reporteEquipos" svgIcon={<ReporteEquiposSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} />
            <MenuButton label="Material" subScreenId="materialApoyo" svgIcon={<MaterialApoyoSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} />
            <MenuButton label="Administrativo" subScreenId="administrativo" svgIcon={<AdministrativoSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} />
            <MenuButton label="Agenda" subScreenId="contactos" svgIcon={<ContactosSVG />} setMenuSubScreen={setMenuSubScreen} menuSubScreen={menuSubScreen} />
          </div>
        ) : renderContent()}
      </div>
      {showResetOSConfirm && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm" onClick={e => e.stopPropagation()}><div className="bg-gray-800 p-10 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl animate-popIn"><h3 className="font-black text-3xl mb-5 uppercase text-white">Nueva Orden</h3><p className="text-base text-gray-400 mb-8 font-bold leading-relaxed">¿Deseas vaciar los campos?</p><div className="flex flex-col gap-4"><button onClick={() => { resetOSForm(); setShowResetOSConfirm(false); setMenuSubScreen('generarOS'); }} className="w-full py-5 text-lg bg-blue-600 text-white rounded-2xl font-black">LIMPIAR</button><button onClick={() => { setShowResetOSConfirm(false); setMenuSubScreen('generarOS'); }} className="w-full py-5 text-lg bg-gray-700 text-gray-300 rounded-2xl font-black">MANTENER</button></div></div></div>)}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm" onClick={e => e.stopPropagation()}>
          <div className="bg-gray-800 p-8 rounded-[2.5rem] w-full max-w-sm text-left shadow-2xl animate-popIn border border-gray-700">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4"><h3 className="font-black text-xl uppercase text-white tracking-tight">Detalles del Equipo</h3><button onClick={() => setSelectedEquipment(null)} className="text-gray-400 hover:text-white text-2xl active:scale-90 transition-transform">✕</button></div>
            <div className="space-y-5 mb-8"><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Serie / SN</p><p className="text-2xl font-black text-blue-400 tracking-tighter">{selectedEquipment.serie}</p></div><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descripción</p><p className="text-sm font-black text-gray-200">{selectedEquipment.descripcion || 'Sin descripción'}</p></div><div className="col-span-2"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Modelo</p><p className="text-sm font-black text-gray-200">{selectedEquipment.modelo || 'N/A'}</p></div></div><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hospital / Unidad</p><p className="text-sm font-black text-white">{selectedEquipment.cliente || 'No especificado'}</p></div><div className="pt-2"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Estatus Actual</p>{sheetOrders.some(so => so.serie === selectedEquipment.serie && so.status && so.status.toLowerCase().includes('abierto')) ? (<span className="bg-orange-900/50 text-orange-400 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest shadow-sm">🔴 CON REPORTE ABIERTO</span>) : (<span className="bg-green-900/50 text-green-400 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest shadow-sm">🟢 SIN REPORTES</span>)}</div></div>
            <div className="flex gap-4"><button onClick={() => setSelectedEquipment(null)} className="flex-1 py-4 text-sm bg-gray-700 hover:bg-gray-600 rounded-2xl font-black text-gray-300 active:scale-95 transition-all">CERRAR</button><button onClick={() => { setReportForm({ ...reportForm, serie: selectedEquipment.serie, modelo: selectedEquipment.modelo || '', descripcionEquipo: selectedEquipment.descripcion || '', cliente: selectedEquipment.cliente || '' }); setSelectedEquipment(null); setMenuSubScreen('generarOS'); }} className="flex-1 py-4 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black active:scale-95 transition-all shadow-lg shadow-blue-500/30">REPORTAR</button></div>
          </div>
        </div>
      )}
      {showGenerateConfirm && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm" onClick={e => e.stopPropagation()}><div className="bg-gray-800 p-10 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl animate-popIn"><h3 className="font-black text-3xl mb-5 text-green-400 uppercase">Confirmar</h3><p className="text-base text-gray-400 mb-8 font-bold leading-relaxed">La información se enviará a la nube.</p><div className="flex gap-4"><button onClick={() => setShowGenerateConfirm(false)} className="flex-1 py-5 text-lg bg-gray-700 rounded-2xl font-black text-gray-300">CERRAR</button><button onClick={() => { setShowGenerateConfirm(false); submitReport(); }} className="flex-1 py-5 text-lg bg-green-600 text-white rounded-2xl font-black">ENVIAR</button></div></div></div>)}
      {contactToDelete && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm" onClick={e => e.stopPropagation()}><div className="bg-gray-800 p-10 rounded-[2.5rem] w-full max-sm text-center shadow-2xl animate-popIn"><h3 className="font-black text-3xl mb-5 text-red-400 uppercase">Eliminar</h3><p className="text-base text-gray-400 mb-8 font-bold leading-relaxed">¿Eliminar a <br/><span className="text-white">{contactToDelete.name}</span>?</p><div className="flex gap-4"><button onClick={() => setContactToDelete(null)} className="flex-1 py-5 text-lg bg-gray-700 rounded-2xl font-black text-gray-300">NO</button><button onClick={() => { deleteContact(contactToDelete.id); setContactToDelete(null); setMessage("CONTACTO ELIMINADO."); setTimeout(() => setMessage(""), 3000); }} className="flex-1 py-5 text-lg bg-red-600 text-white rounded-2xl font-black">SÍ</button></div></div></div>)}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-sm" onClick={() => setSelectedContact(null)}>
          <div className="bg-gray-800 p-8 rounded-[2.5rem] w-full max-sm text-left shadow-2xl animate-popIn border border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4"><h3 className="font-black text-xl uppercase text-purple-400 tracking-tight">Detalles de Contacto</h3><button onClick={() => setSelectedContact(null)} className="text-gray-400 hover:text-white text-2xl active:scale-90 transition-transform">✕</button></div>
            <div className="space-y-5 mb-8"><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre</p><p className="text-xl font-black text-white leading-tight uppercase mt-1">{selectedContact.name}</p></div><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hospital / Unidad</p><p className="text-sm font-black text-gray-200 uppercase mt-1">{selectedContact.client}</p></div><div className="flex items-center gap-4 bg-gray-700/50 p-4 rounded-2xl border border-gray-600"><span className="text-2xl">📞</span><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Teléfono</p><p className="text-lg font-black text-blue-400 font-mono mt-0.5">{selectedContact.phone}</p></div></div>{selectedContact.email && (<div className="flex items-center gap-4 bg-gray-700/50 p-4 rounded-2xl border border-gray-600"><span className="text-2xl">✉️</span><div className="overflow-hidden"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Correo Electrónico</p><p className="text-xs font-bold text-gray-300 truncate mt-0.5">{selectedContact.email}</p></div></div>)}</div>
            <div className="flex gap-4"><button onClick={() => setSelectedContact(null)} className="flex-1 py-4 text-sm bg-gray-700 hover:bg-gray-600 rounded-2xl font-black text-gray-300 active:scale-95 transition-all">CERRAR</button><a href={`tel:${selectedContact.phone}`} className="flex-1 py-4 text-sm bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black active:scale-95 transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-2 text-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>LLAMAR</a></div>
          </div>
        </div>
      )}
      {zoomedImageId && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[200] backdrop-blur-md transition-opacity" onClick={() => setZoomedImageId(null)}>
          <div className="relative max-w-full max-h-full flex flex-col items-center justify-center animate-popIn" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedImageId(null)} className="absolute -top-12 right-0 text-white bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center text-xl font-black shadow-lg active:scale-90 transition-all">✕</button>
            <img src={`https://drive.google.com/thumbnail?id=${zoomedImageId}&sz=w1000`} alt="Refacción Ampliada" className="max-w-[100vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-gray-700 bg-gray-900/50" onError={(e) => { e.target.src = 'https://placehold.co/800x800?text=Imagen+No+Disponible'; }} />
          </div>
        </div>
      )}
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
  const [contacts, setContacts] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [sheetOrders, setSheetOrders] = useState([]); 
  const [loginForm, setLoginForm] = useState({ engineerName: '', password: '' });

  const stateRef = useRef({ screen, menuSubScreen, documentationSubScreen, currentSparePartView });

  useEffect(() => {
    stateRef.current = { screen, menuSubScreen, documentationSubScreen, currentSparePartView };
  }, [screen, menuSubScreen, documentationSubScreen, currentSparePartView]);

  useEffect(() => {
    document.title = "Fresenius Hub";
    const iconUrl = "https://lh3.googleusercontent.com/d/1xl3VUyb0n-2wDlaBO06KRamI13PuWX8z";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = iconUrl;
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) { appleLink = document.createElement('link'); appleLink.rel = 'apple-touch-icon'; appleLink.href = iconUrl; document.head.appendChild(appleLink); }
    appleLink.href = iconUrl;
    const manifest = { name: "Fresenius Engineering Hub", short_name: "Fresenius", start_url: "/", display: "standalone", background_color: "#111827", theme_color: "#2563eb", icons: [{ src: iconUrl, sizes: "192x192 512x512", type: "image/png", purpose: "any maskable" }] };
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    let manifestLink = document.querySelector("link[rel='manifest']");
    if (!manifestLink) { manifestLink = document.createElement('link'); manifestLink.rel = 'manifest'; document.head.appendChild(manifestLink); }
    manifestLink.href = URL.createObjectURL(manifestBlob);
  }, []);

  const navigate = (s, ms = 'dashboard', ds = null, csv = null) => {
    setScreen(s); setMenuSubScreen(ms); setDocumentationSubScreen(ds); setCurrentSparePartView(csv);
    window.history.pushState({ screen: s, menuSub: ms, docSub: ds, spareView: csv }, '');
  };

  const handleScreenChange = (newScreen) => {
    if (newScreen === 'login') { setLoginForm({ engineerName: '', password: '' }); }
    else if (newScreen === 'landing') { setLoginForm({ engineerName: '', password: '' }); }
    navigate(newScreen);
  };

  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => { setError(''); setMessage(''); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  useEffect(() => {
    const initialState = { screen: 'landing', menuSub: 'dashboard', docSub: null, spareView: null };
    window.history.replaceState(initialState, '');
    window.history.pushState(initialState, '');
    window.history.pushState(initialState, '');
    window.history.pushState(initialState, '');
    const handlePopState = (event) => {
      const current = stateRef.current;
      if (current.screen === 'landing' || (current.screen === 'menu' && current.menuSubScreen === 'dashboard')) {
        window.history.pushState({ screen: current.screen, menuSub: current.menuSubScreen, docSub: current.documentationSubScreen, spareView: current.currentSparePartView }, '');
        return;
      }
      if (event.state) {
        const { screen, menuSub, docSub, spareView } = event.state;
        setScreen(screen); setMenuSubScreen(menuSub); setDocumentationSubScreen(docSub || null); setCurrentSparePartView(spareView || null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { 
          await signInWithCustomToken(auth, __initial_auth_token); 
        }
      } catch (e) { console.error("Error de autenticación", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const resp = await fetch(`https://docs.google.com/spreadsheets/d/e/2PACX-1vS86FFjvfk8XJXF0bqgcyzAhADOQbtLDFH7JwFcFvqWxJHZugcqxGPky63hB65KJXRfChRXK_kapw3x/pub?gid=0&single=true&output=csv&t=${Date.now()}`);
        const text = await resp.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const data = rows.slice(1).filter(r => r.trim()).map((row, idx) => {
          const vals = []; let curr = '', inQ = false;
          for (let c of row) { if(c === '"') inQ = !inQ; else if(c === ',' && !inQ) { vals.push(curr.trim().replace(/^"|"$/g, '')); curr = ''; } else curr += c; }
          vals.push(curr.trim().replace(/^"|"$/g, ''));
          const obj = { id: idx };
          headers.forEach((h, i) => { 
            const v = vals[i] || ''; 
            if(h.includes('serie')) obj.serie = v; 
            if(h.includes('modelo')) obj.modelo = v; 
            if(h.includes('descripc')) obj.descripcion = v; 
            if(h.includes('cliente')) obj.cliente = v; 
            if(h.includes('responsable')) obj.responsable = v; 
          });
          return obj;
        });
        setEquipment(data);
      } catch (e) { console.error("Error al obtener equipo", e); }
    };
    fetchEquipment();
  }, []);

  useEffect(() => {
    const fetchSheetOrders = async () => {
      try {
        const resp = await fetch(`https://docs.google.com/spreadsheets/d/e/2PACX-1vRqMsPTihy-C9WpValwIav8qpZMi7r710R3M3cOPakcgQ2kEhMJVl1Mw4UlKSt8yB6J2EP_wU5tcm3A/pub?gid=0&single=true&output=csv&t=${Date.now()}`);
        const text = await resp.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const data = rows.slice(1).filter(r => r.trim()).map((row, idx) => {
          const vals = []; let curr = '', inQ = false;
          for (let c of row) { if(c === '"') inQ = !inQ; else if(c === ',' && !inQ) { vals.push(curr.trim().replace(/^"|"$/g, '')); curr = ''; } else curr += c; }
          vals.push(curr.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, i) => { 
            const v = vals[i] || ''; 
            if(h.includes('estatus') || h.includes('status')) obj.status = v || 'Abierto';
            else if(h.includes('serie')) obj.serie = v; 
            else if(h.includes('modelo')) obj.modelo = v; 
            else if(h.includes('cliente') || h.includes('hospital')) obj.cliente = v; 
            else if(h.includes('ingeniero')) obj.engineerName = v; 
            else if(h === 'falla') obj.falla = v; 
            else if(h.includes('codigo') && h.includes('falla')) obj.codigoFalla = v;
            else if(h.includes('descripc') && h.includes('falla')) obj.descripcionFalla = v;
            else if(h.includes('descripc') && !h.includes('falla')) obj.descripcionEquipo = v;
            else if(h.includes('falla') && !h.includes('codigo') && !h.includes('descripc') && !h.includes('catalogo')) { if (!obj.falla) obj.falla = v; }
            else if(h.includes('tipo')) obj.tipoOS = v; 
            else if(h.includes('fecha')) obj.createdAt = v; 
            else if(h.includes('reporta') || h.includes('contacto')) obj.reporta = v; 
            else if(h.includes('telefono')) obj.telefono = v; 
            else if(h.includes('email') || h.includes('correo electrónico') || h.includes('correo electronico') || h.includes('correo')) obj.email = v;
            else if(h.includes('area') || h.includes('área')) obj.area = v;
            else if(h.includes('observaciones')) obj.observaciones = v; 
            else if(h.includes('firebase')) obj.id = v; 
          });
          if (!obj.id) obj.id = `sheet-${idx}`;
          return obj;
        });
        setSheetOrders(data);
      } catch (errorSync) { console.error("Error al obtener órdenes de Sheets", errorSync); }
    };
    if (user) { fetchSheetOrders(); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubContacts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'contacts'), s => setContacts(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.error(e));
    // Nos aseguramos que el lector en tiempo real también escuche la ruta raíz
    const unsubOrders = onSnapshot(collection(db, 'service_orders'), s => setServiceOrders(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.error(e));
    return () => { if(unsubContacts) unsubContacts(); if(unsubOrders) unsubOrders(); };
  }, [user]);

  const loginEngineer = async () => {
    if (!loginForm.engineerName || !loginForm.password) { setError("INGRESE PIN."); return; }
    setLoading(true);
    try {
      const parts = loginForm.engineerName.split('-');
      const namePart = parts.length > 1 ? parts[1].trim() : loginForm.engineerName.trim();
      
      const cleanName = namePart
        .toLowerCase()
        .replace(/ñ/g, 'n')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ".");
        
      const email = `${cleanName}@fresenius-kabi.com`;

      await signInWithEmailAndPassword(auth, email, loginForm.password);
      
      setError(''); 
      setLoginForm(prev => ({ ...prev, password: '' })); // Conservamos el nombre, limpiamos solo el PIN
      navigate('menu');
    } catch (e) { 
      setLoginForm(prev => ({ ...prev, password: '' }));
      setError("PIN incorrecto para el ingeniero seleccionado"); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return (<div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-blue-400 font-black gap-4"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><div className="animate-pulse tracking-widest text-xs font-black">Fresenius Hub...</div></div>);

  return (
    <div className="min-h-[100dvh] bg-gray-900 md:p-4 flex items-center justify-center font-sans overflow-hidden overscroll-none">
      <div className="w-full h-[100dvh] md:h-auto md:min-h-[850px] md:max-h-[95vh] max-w-[480px] bg-gray-800 p-6 md:p-8 md:rounded-[3rem] md:border-8 border-gray-700 relative flex flex-col md:shadow-2xl overscroll-none">
        <div className="absolute top-8 left-0 right-0 px-8 z-[60] pointer-events-none text-center">
          {error && <div className="bg-red-500 text-white p-4 text-xs rounded-2xl mb-2 font-black shadow-lg animate-popIn uppercase tracking-widest pointer-events-auto">{error}</div>}
          {message && screen !== 'menu' && <div className="bg-green-500 text-white p-4 text-xs rounded-2xl mb-2 font-black shadow-lg animate-popIn uppercase tracking-widest pointer-events-auto">{message}</div>}
        </div>
        <div className="flex-1 overflow-y-auto scroll-smooth overscroll-none overflow-x-hidden">
          {screen === 'landing' && <LandingScreen setScreen={handleScreenChange} />}
          {screen === 'login' && <LoginScreen form={loginForm} onChange={e => setLoginForm({...loginForm, [e.target.name]: e.target.value})} onSubmit={loginEngineer} loading={loading} setScreen={handleScreenChange} />}
          {screen === 'menu' && (
            <MenuScreen 
              menuSubScreen={menuSubScreen} setMenuSubScreen={(val) => navigate('menu', val)} 
              loginForm={loginForm} setScreen={handleScreenChange} setMessage={setMessage} setError={setError} userId={user?.uid} db={db} contacts={contacts} 
              addContact={c => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'contacts'), {...c, addedBy: user?.uid})} 
              deleteContact={id => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'contacts', id))} serviceOrders={serviceOrders} sheetOrders={sheetOrders} setSheetOrders={setSheetOrders} equipment={equipment} 
              documentationSubScreen={documentationSubScreen} setDocumentationSubScreen={(val) => navigate('menu', menuSubScreen === 'materialApoyo' ? 'materialApoyo' : menuSubScreen, val)}
              currentSparePartView={currentSparePartView} setCurrentSparePartView={(val) => navigate('menu', 'materialApoyo', 'SPAREPARTS', val)}
            />
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700 text-center flex justify-center items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><p className="text-[9px] font-black text-gray-500 tracking-[0.4em] uppercase">FRESENIUS KABI • Engineering Hub</p></div>
      </div>
      <style>{`
        html, body { overscroll-behavior-y: none; height: 100%; overflow: hidden; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { max-height: 0; opacity: 0; } to { max-height: 1000px; opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideDown { animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-popIn { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
        input:focus, textarea:focus { scroll-margin-bottom: 20px; }
        * { scrollbar-color: #4b5563 transparent; -webkit-tap-highlight-color: transparent; }
        .overscroll-none { overscroll-behavior: none; }
      `}</style>
    </div>
  );
}