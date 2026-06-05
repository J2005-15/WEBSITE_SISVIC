import { useState, useEffect } from 'react';
import axios from 'axios';
import logoNevado from './assets/Logo_Nevado.png';
import imagenVeterinaria from './assets/Hero.jpg';
// Agregamos todos los íconos de Lucide React en una sola línea
import { Heart, Palette, Zap, Shield, Dog, Cat, Mail, Search, CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import emailjs from '@emailjs/browser';

c
const API_BASE = "https://sisvic-api.onrender.com";
const API_URL = `${API_BASE}/api/public`;

function App() {
  // ==========================================
  // 1. ESTADOS GLOBALES (APP Y MASCOTAS)
  // ==========================================
  const [pets, setPets] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAdoptionForm, setShowAdoptionForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  
  // ==========================================
  // 2. ESTADOS DE FORMULARIOS
  // ==========================================
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [adoptionError, setAdoptionError] = useState('');
  
  const [isDonationSubmitted, setIsDonationSubmitted] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // ==========================================
  // 3. ESTADOS DE LA CONSULTA DE ESTATUS
  // ==========================================
  const [email, setEmail] = useState('');
  const [tramites, setTramites] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [buscado, setBuscado] = useState(false);

  // Paleta de colores dinámica
  const theme = {
    bg: isDarkMode ? 'bg-[#121416]' : 'bg-[#FFEFD1]', 
    text: isDarkMode ? 'text-[#F8F9FA]' : 'text-[#212529]',
    navBg: isDarkMode ? 'bg-[#121416]/40' : 'bg-[#FFEFD1]/30', 
    cardBg: isDarkMode ? 'bg-[#212529]' : 'bg-[#FFDAD2]', 
    border: isDarkMode ? 'border-[#2D6A4F]/30' : 'border-[#2D6A4F]/10',
  };

  // ==========================================
  // EFECTOS Y FUNCIONES DE MASCOTAS
  // ==========================================
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/public/pets`);
        if (data.pets && data.pets.length > 0) {
          setPets(data.pets);
        }
      } catch (err) {
        console.error("Error al obtener mascotas:", err.message);
      }
    };
    fetchPets();
  }, []);

  const parsePetDetails = (description) => {
    const details = { historia: '', sexo: 'N/A', color: 'N/A', comportamiento: 'N/A', estado: 'N/A' };
    if (!description) return details;
    const parts = description.split('|').map(p => p.trim());
    details.historia = parts[0];
    parts.forEach(part => {
      if (part.includes('Sexo:')) details.sexo = part.replace('Sexo:', '').trim();
      if (part.includes('Color:')) details.color = part.replace('Color:', '').trim();
      if (part.includes('Comportamiento:')) details.comportamiento = part.replace('Comportamiento:', '').trim();
      if (part.includes('Estado:')) details.estado = part.replace('Estado:', '').trim();
    });
    return details;
  };

  // ==========================================
  // HANDLERS (ENVIOS Y BÚSQUEDAS)
  // ==========================================
const handleAdoptionSubmit = async (e) => {
    e.preventDefault();
    setAdoptionLoading(true);
    setAdoptionError('');
    const f = e.target;
    const payload = {
      id_pet: selectedPet,
      visitor_name: f.visitor_name.value,
      visitor_email: f.visitor_email.value,
      visitor_phone: f.visitor_phone.value,
    };
    try {
      // 1. Guardar en base de datos
      await axios.post(`${API_BASE}/api/public/adoption`, payload);
      
      // 2. Enviar correo de adopción
      await emailjs.send(
        'service_9yojyyo',
        'template_tcdnbc8',
        {
          visitor_name: f.visitor_name.value,
          visitor_email: f.visitor_email.value,
        },
        'NyD6i0L4xJ8Fg872m'
      );

      setIsSubmitted(true);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.message || d?.error || d?.errors?.[0]?.msg || 'Error al enviar la solicitud.';
      setAdoptionError(msg);
    } finally {
      setAdoptionLoading(false);
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setDonationLoading(true);
    setDonationError('');
    const f = e.target;
    const payload = {
      visitor_name: f.visitor_name.value,
      visitor_email: f.visitor_email.value,
      visitor_phone: f.visitor_phone.value,
      amount: f.amount.value,
      payment_method: f.payment_method.value,
      destination_bank: f.destination_bank?.value || '', // Previene error si no existe
      payment_reference: f.payment_reference.value,
      payment_date: f.payment_date.value,
    };
    try {
      // 1. Guardar en base de datos
      await axios.post(`${API_BASE}/api/public/donations`, payload);
      
      // 2. Enviar correo de donación
      await emailjs.send(
        'service_9yojyyo',
        'template_3bx6gjh',
        {
          visitor_name: f.visitor_name.value,
          visitor_email: f.visitor_email.value,
          amount: f.amount.value,
          reference: f.payment_reference.value
        },
        'NyD6i0L4xJ8Fg872m'
      );

      setIsDonationSubmitted(true);
    } catch (err) {
      setDonationError(err.response?.data?.message ?? 'Error al registrar el aporte.');
    } finally {
      setDonationLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setCargando(true);
    setSearchError('');
    setBuscado(true);
    setTramites([]);
    try {
      const { data } = await axios.get(`${API_BASE}/api/status/${email}`);
      setTramites(data.tramites || []);
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Error al consultar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Utilidades para los colores de la consulta
  const getEstadoColor = (estado) => {
    const lower = estado?.toLowerCase() || '';
    if (lower.includes('aprobada') || lower.includes('confirmado')) return `${isDarkMode ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-50'}`;
    if (lower.includes('pendiente') || lower.includes('verificar')) return `${isDarkMode ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-600 bg-yellow-50'}`;
    if (lower.includes('rechazada') || lower.includes('inválido')) return `${isDarkMode ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-50'}`;
    return `${isDarkMode ? 'text-slate-400 bg-slate-700' : 'text-slate-600 bg-slate-50'}`;
  };

  const getEstadoIcon = (estado) => {
    const lower = estado?.toLowerCase() || '';
    if (lower.includes('aprobada') || lower.includes('confirmado')) return <CheckCircle className="w-5 h-5" />;
    if (lower.includes('pendiente') || lower.includes('verificar')) return <Clock className="w-5 h-5" />;
    if (lower.includes('rechazada') || lower.includes('inválido')) return <XCircle className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      
      {/* NAVBAR */}
      <nav className={`fixed w-full top-0 z-50 backdrop-blur-lg border-b transition-colors duration-300 ${theme.navBg} ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
          <img src={logoNevado} alt="Logo Misión Nevado" className="h-16 md:h-20 object-contain drop-shadow-sm" />
          
          <div className={`hidden md:flex gap-1 font-bold ${isDarkMode ? 'text-[#F8F9FA]' : 'text-[#212529]'}`}>
            {['Inicio', 'Impacto', 'Animalitos', 'Donar', 'Consulta'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="px-5 py-2 rounded-full hover:bg-[#2D6A4F]/10 dark:hover:bg-[#D4AC4E]/20 transition-all">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2 rounded-full border transition-all hover:scale-110 ${isDarkMode ? 'border-[#D4AC4E]/30 bg-[#212529]' : 'border-[#2D6A4F]/20 bg-white/15'}`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-[#D4AC4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-40 pb-20 lg:pt-44 lg:pb-28 overflow-hidden" id="inicio">
        <div className="absolute inset-0 z-0">
          <img src={imagenVeterinaria} alt="Fondo Veterinaria" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#2D6A4F]/85"></div> 
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 text-white">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-[#D4AC4E] text-xs font-bold mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AC4E] animate-pulse"></span>
              Fundación de Rescate Animal
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight drop-shadow-md">
              Dale una <br/><span className="text-[#D4AC4E]">segunda oportunidad</span> <br/>a quien lo necesita.
            </h1>
            <p className="text-lg opacity-90 mb-8 max-w-lg font-medium leading-relaxed">
              Trabajamos incansablemente para brindar atención médica, resguardo y familias amorosas a la fauna vulnerable en La Grita - Táchira.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#animalitos" className="bg-[#D4AC4E] text-[#212529] px-8 py-3.5 rounded-full font-bold shadow-lg hover:opacity-90 transition-all">🐾 Quiero Adoptar</a>
              <a href="#donar" className="bg-transparent border-2 border-white/80 text-white px-8 py-3.5 rounded-full font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                <span className="text-[#E76F51]">♡</span> Hacer una Donación
              </a>
            </div>
          </div>
          <div className="relative hidden lg:block px-4">
            <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80" alt="Perritos rescatados" className="relative z-10 rounded-[2.5rem] shadow-2xl object-cover h-[450px] w-full border-[12px] border-white/10 backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-500" />
          </div>
        </div>
      </header>

      {/* IMPACTO */}
      <section className="bg-[#D4AC4E] py-12 border-b-8 border-[#2D6A4F]" id="impacto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#212529]/10">
          <div className="py-4"><h3 className="text-4xl font-black text-[#212529]">+850</h3><p className="text-[#2D6A4F] font-bold uppercase tracking-wider mt-1">Rescates Exitosos</p></div>
          <div className="py-4"><h3 className="text-4xl font-black text-[#212529]">+420</h3><p className="text-[#2D6A4F] font-bold uppercase tracking-wider mt-1">Familias Encontradas</p></div>
          <div className="py-4"><h3 className="text-4xl font-black text-[#212529]">24/7</h3><p className="text-[#2D6A4F] font-bold uppercase tracking-wider mt-1">Atención Continua</p></div>
        </div>
      </section>

      {/* GALERÍA DE MASCOTAS */}
      <main className="py-24 max-w-7xl mx-auto px-6" id="animalitos">
        <h2 className={`text-4xl font-extrabold text-center mb-16 ${theme.text}`}>Cartelera de Adopción</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {pets.map((pet, idx) => {
            const details = parsePetDetails(pet.description);
            const isPerro = pet.species && (pet.species.toLowerCase().includes('perro') || pet.species.toLowerCase().includes('canino'));
            const specieText = isPerro ? 'PERRO' : 'GATO';
            const specieIcon = isPerro ? <Dog className="w-4 h-4" /> : <Cat className="w-4 h-4" />;
            const specieColor = isPerro ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';

            return (
              <div key={pet.id_pet || pet.id || `pet-${idx}`} className={`${theme.cardBg} rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col border border-[#2D6A4F]/10 hover:border-[#2D6A4F]/30`}>
                <div className="relative overflow-hidden h-56 w-full">
                  <img src={pet.image_url || 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Sin+Foto'} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" alt={pet.name} onError={(e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Sin+Foto'; }} />
                  <div className={`absolute top-4 right-4 ${specieColor} px-3 py-2 rounded-full font-bold text-sm flex items-center gap-1 shadow-lg`}>
                    {specieIcon} {specieText}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className={`text-3xl font-black mb-1 ${theme.text}`}>{pet.name}</h3>
                  <p className={`text-xs font-bold mb-4 opacity-70 uppercase tracking-wide`}>{pet.breed} • {pet.age}</p>
                  <p className="text-sm opacity-75 mb-5 leading-relaxed line-clamp-2">{details.historia}</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-pink-900/30 text-pink-200' : 'bg-pink-100 text-pink-700'}`}><Heart className="w-4 h-4 flex-shrink-0" /><span className="line-clamp-1">{details.sexo}</span></div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-100 text-yellow-700'}`}><Palette className="w-4 h-4 flex-shrink-0" /><span className="line-clamp-1">{details.color}</span></div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-700'}`}><Zap className="w-4 h-4 flex-shrink-0" /><span className="line-clamp-1">{details.comportamiento}</span></div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-700'}`}><Shield className="w-4 h-4 flex-shrink-0" /><span className="line-clamp-1">{details.estado}</span></div>
                  </div>
                  <button onClick={() => { setSelectedPet(pet.id_pet ?? pet.id); setShowAdoptionForm(true); }} className="w-full bg-gradient-to-r from-[#D4AC4E] to-[#C49A3A] hover:from-[#C49A3A] hover:to-[#B5862D] text-[#212529] font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-wide text-sm">
                    🐾 Adoptar a {pet.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL DE ADOPCIÓN */}
      {showAdoptionForm && (
        <div className="fixed inset-0 bg-[#212529]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`p-10 rounded-[2rem] max-w-lg w-full relative shadow-2xl border ${theme.cardBg} border-[#2D6A4F]/20`}>
            <button onClick={() => { setShowAdoptionForm(false); setIsSubmitted(false); }} className="absolute top-6 right-6 text-slate-400 hover:text-[#2D6A4F]">✕</button>
            {isSubmitted ? (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-[#2D6A4F] mb-3">¡Solicitud Enviada!</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">Hemos recibido tus datos con éxito. Nuestro equipo se comunicará contigo muy pronto. ¡Gracias por abrir tu corazón!</p>
                <button onClick={() => { setShowAdoptionForm(false); setIsSubmitted(false); }} className="w-full bg-[#2D6A4F] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all">Volver al Inicio</button>
              </div>
            ) : (
              <form onSubmit={handleAdoptionSubmit} className="flex flex-col gap-5">
                <h3 className="text-2xl font-extrabold mb-2 text-[#2D6A4F]">Solicitud de Adopción</h3>
                <input type="text" name="visitor_name" placeholder="Nombre Completo" required className={`w-full border p-3.5 rounded-xl ${isDarkMode ? 'bg-[#FFEFD1] text-[#212529]' : 'bg-[#FFEFD1] text-[#212529]'}`} />
                <input type="email" name="visitor_email" placeholder="Correo Electrónico" pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" title="Ingresa un correo válido (ej: tu@gmail.com)" required className={`w-full border p-3.5 rounded-xl ${isDarkMode ? 'bg-[#FFEFD1] text-[#212529]' : 'bg-[#FFEFD1] text-[#212529]'}`} />
                <input type="text" name="visitor_phone" placeholder="Teléfono" required className={`w-full border p-3.5 rounded-xl ${isDarkMode ? 'bg-[#FFEFD1] text-[#212529]' : 'bg-[#FFEFD1] text-[#212529]'}`} />
                {adoptionError && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2">{adoptionError}</p>}
                <button type="submit" disabled={adoptionLoading} className="w-full bg-[#2D6A4F] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {adoptionLoading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN DONACIONES */}
      <section className={`py-24 border-t transition-colors duration-300 ${theme.border}`} id="donar">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2D6A4F]/20 bg-white dark:bg-transparent text-[#2D6A4F] dark:text-[#D4AC4E] text-xs font-bold mb-4">
              <Heart className="w-4 h-4" /> Tu apoyo salva vidas
            </span>
            <h2 className={`text-4xl font-extrabold mb-4 ${theme.text}`}>Apoya Nuestra Misión</h2>
            <p className={`max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Tu donación nos ayuda a continuar rescatando, rehabilitando y encontrando hogares para animales en La Grita. Cada aporte hace la diferencia.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Datos Bancarios Omitidos por brevedad pero intactos en funcionalidad */}
            <div className={`p-8 md:p-10 rounded-3xl shadow-xl border-t-8 border-t-[#2D6A4F] ${theme.cardBg}`}>
              <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${theme.text}`}>Datos Bancarios</h3>
              <div className="space-y-4">
                <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#121416] border-slate-700' : 'bg-[#FFEFD1] border-transparent shadow-sm'}`}>
                  <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Banco de Venezuela</h4>
                  <p className="text-sm font-medium">Cuenta: <span className="font-mono">0102-0123-45-0000123456</span></p>
                  <p className="text-sm font-medium">RIF: <span className="font-mono">J-12345678-9</span></p>
                </div>
                <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#121416] border-slate-700' : 'bg-[#FFEFD1] border-transparent shadow-sm'}`}>
                  <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Banesco</h4>
                  <p className="text-sm font-medium">Cuenta: <span className="font-mono">0134-0987-65-1111000114</span></p>
                  <p className="text-sm font-medium">RIF: <span className="font-mono">J-12345678-9</span></p>
                </div>
                <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#121416] border-slate-700' : 'bg-[#FFEFD1] border-transparent shadow-sm'}`}>
                  <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Pago Móvil</h4>
                  <p className="text-sm font-medium">Teléfono: <span className="font-mono">0414-7012345</span></p>
                  <p className="text-sm font-medium">RIF: <span className="font-mono">J-123456789</span> (0102)</p>
                </div>
              </div>
            </div>

            {/* Formulario de Reporte de Donación */}
            <div className={`p-8 md:p-10 rounded-3xl shadow-xl border-t-8 border-t-[#E76F51] ${theme.cardBg}`}>
              {isDonationSubmitted ? (
                <div className="text-center animate-in fade-in zoom-in duration-300 py-10">
                  <div className="w-20 h-20 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-black text-[#2D6A4F] mb-3">¡Aporte Registrado!</h3>
                  <p className="text-slate-600 mb-8 leading-relaxed">Gracias por tu generosidad. Hemos registrado tu aporte y nuestro equipo lo procesará en breve.</p>
                  <button onClick={() => setIsDonationSubmitted(false)} className="w-full bg-[#2D6A4F] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all">Reportar otro aporte</button>
                </div>
              ) : (
                <form onSubmit={handleDonationSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nombre</label>
                    <input type="text" name="visitor_name" required className={`w-full border p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] ${isDarkMode ? 'bg-[#121416] border-slate-700 text-[#F8F9FA]' : 'bg-[#FFEFD1] border-transparent text-[#212529]'}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Correo</label>
                    <input type="email" name="visitor_email" required className={`w-full border p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] ${isDarkMode ? 'bg-[#121416] border-slate-700 text-[#F8F9FA]' : 'bg-[#FFEFD1] border-transparent text-[#212529]'}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Teléfono</label>
                    <input type="text" name="visitor_phone" required className={`w-full border p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] ${isDarkMode ? 'bg-[#121416] border-slate-700 text-[#F8F9FA]' : 'bg-[#FFEFD1] border-transparent text-[#212529]'}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Monto (Bs.)</label>
                    <input type="number" step="0.01" name="amount" required className={`w-full border p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] ${isDarkMode ? 'bg-[#121416] border-slate-700 text-[#F8F9FA]' : 'bg-[#FFEFD1] border-transparent text-[#212529]'}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Método de Pago</label>
                    <select name="payment_method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required className={`w-full border-2 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] transition-all ${isDarkMode ? 'bg-[#121416] border-[#D4AC4E]/40 text-[#F8F9FA]' : 'bg-white border-[#2D6A4F]/20 text-[#212529]'}`}>
                      <option value=""> 📋 Selecciona el método </option>
                      <option value="Transferencia">🏦 Transferencia Bancaria</option>
                      <option value="Pago Móvil">📱 Pago Móvil</option>
                    </select>
                  </div>
                  {paymentMethod === 'Transferencia' && (
                    <div className="animate-in fade-in duration-300">
                      <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Banco Destino</label>
                      <select name="destination_bank" required className={`w-full border-2 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] transition-all ${isDarkMode ? 'bg-[#121416] border-[#D4AC4E]/40 text-[#F8F9FA]' : 'bg-white border-[#2D6A4F]/20 text-[#212529]'}`}>
                        <option value=""> 🏦 Selecciona banco </option>
                        <option value="Banco de Venezuela">Banco de Venezuela</option>
                        <option value="Banesco">Banesco</option>
                      </select>
                    </div>
                  )}
                  {paymentMethod === 'Pago Móvil' && (
                    <div className="animate-in fade-in duration-300">
                      <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Banco</label>
                      <select name="destination_bank" required className={`w-full border-2 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] transition-all ${isDarkMode ? 'bg-[#121416] border-[#D4AC4E]/40 text-[#F8F9FA]' : 'bg-white border-[#2D6A4F]/20 text-[#212529]'}`}>
                        <option value="Banco de Venezuela">Banco de Venezuela</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Número de Referencia</label>
                    <input type="text" name="payment_reference" required className={`w-full border p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] ${isDarkMode ? 'bg-[#121416] border-slate-700 text-[#F8F9FA]' : 'bg-[#FFEFD1] border-transparent text-[#212529]'}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Fecha</label>
                    <input type="date" name="payment_date" required className={`w-full border p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] ${isDarkMode ? 'bg-[#121416] border-slate-700 text-[#F8F9FA]' : 'bg-[#FFEFD1] border-transparent text-[#212529]'}`} />
                  </div>
                  {donationError && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2">{donationError}</p>}
                  <button type="submit" disabled={donationLoading} className="w-full bg-[#2D6A4F] text-white py-4 rounded-xl font-bold hover:opacity-90 mt-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {donationLoading ? 'Registrando...' : 'Registrar Aporte'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN INTEGRADA DE CONSULTA DE ESTATUS */}
      <section className={`py-24 transition-colors duration-300 ${theme.bg}`} id="consulta">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16 animate-in fade-in duration-500">
            <div className={`inline-block px-4 py-2 rounded-full mb-4 ${isDarkMode ? 'bg-[#D4AC4E]/10 text-[#D4AC4E]' : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'}`}>
              <span className="text-sm font-bold uppercase tracking-wider">Seguimiento de trámites</span>
            </div>
            <h2 className={`text-5xl font-extrabold mb-4 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Consulta tu Trámite</h2>
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Ingresa tu correo electrónico para ver el estado de tus solicitudes de adopción y donaciones en tiempo real.
            </p>
          </div>

          <div className={`rounded-3xl shadow-2xl p-10 border-2 transition-all backdrop-blur-sm ${isDarkMode ? 'bg-[#212529] border-[#D4AC4E]/30 hover:border-[#D4AC4E]/50' : 'bg-white/80 border-[#2D6A4F]/20 hover:border-[#2D6A4F]/40'}`}>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-[#D4AC4E]/50' : 'text-[#2D6A4F]/50'}`} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.correo@ejemplo.com" required 
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-2 transition-all ${isDarkMode ? 'bg-[#121416] border-[#D4AC4E]/30 text-white focus:border-[#D4AC4E]' : 'bg-[#FFEFD1] border-[#2D6A4F]/20 text-[#212529] focus:border-[#2D6A4F]'}`} />
              </div>
              <button type="submit" disabled={cargando} className={`w-full font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${isDarkMode ? 'bg-[#D4AC4E] hover:bg-[#c49a3a] text-[#1a1a1a]' : 'bg-[#2D6A4F] hover:bg-[#1a4d36] text-white'}`}>
                {cargando ? <span>Buscando...</span> : <><Search className="w-5 h-5" /> Consultar Estado</>}
              </button>
            </form>

            {searchError && (
              <div className={`mt-6 p-4 rounded-2xl border ${isDarkMode ? 'bg-red-900/20 border-red-700/50 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <p className="font-medium text-center">{searchError}</p>
              </div>
            )}

            {buscado && !searchError && (
              <div className="mt-8 space-y-4">
                {cargando ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin"><div className={`w-12 h-12 border-4 rounded-full ${isDarkMode ? 'border-[#D4AC4E]/20 border-t-[#D4AC4E]' : 'border-[#2D6A4F]/20 border-t-[#2D6A4F]'}`}></div></div>
                  </div>
                ) : tramites.length > 0 ? (
                  <>
                    <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Tus Trámites:</h3>
                    {tramites.map((tramite, idx) => (
                      <div key={`${tramite.tipo}-${tramite.id}-${idx}`} className={`border-l-4 p-5 rounded-2xl transition-all duration-300 hover:shadow-lg ${isDarkMode ? 'border-[#D4AC4E] bg-[#121416] hover:bg-[#121416]/80' : 'border-[#2D6A4F] bg-white hover:bg-white/80'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className={`text-lg font-bold ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>
                              {tramite.tipo === 'Adopción' ? '🐾' : '💝'} {tramite.tipo}
                            </p>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <span className="font-semibold">Referencia:</span> <span className="font-mono text-xs px-2 py-1 rounded bg-black/10 dark:bg-white/10">{tramite.referencia}</span>
                            </p>
                            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>📅 {new Date(tramite.fecha).toLocaleDateString('es-VE')}</p>
                          </div>
                          <div className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm whitespace-nowrap ${getEstadoColor(tramite.estado)}`}>
                            {getEstadoIcon(tramite.estado)}
                            <span>{tramite.estado}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`relative pt-16 pb-8 transition-colors backdrop-blur-xl ${theme.navBg}`} id="contacto">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12 relative z-10">
          <div className="flex flex-col gap-4">
            <img src={logoNevado} alt="Logo Misión Nevado" className="h-16 object-contain w-fit drop-shadow-sm" />
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#FFEFD1]/70' : 'text-[#212529]/60'}`}>
              Protegiendo la vida animal y gestionando rescates a través del sistema administrativo SISCVI.
            </p>
          </div>
          <div>
            <h4 className={`font-bold mb-6 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Accesos</h4>
            <ul className={`text-sm flex flex-col gap-3 ${isDarkMode ? 'text-[#FFEFD1]/70' : 'text-[#212529]/70'}`}>
              <li><a href="#inicio" className="hover:text-[#2D6A4F] dark:hover:text-[#D4AC4E]">Volver al Inicio</a></li>
              <li><a href="#impacto" className="hover:text-[#2D6A4F] dark:hover:text-[#D4AC4E]">Nuestro Impacto</a></li>
              <li><a href="#animalitos" className="hover:text-[#2D6A4F] dark:hover:text-[#D4AC4E]">Cartelera Activa</a></li>
            </ul>
          </div>
          <div>
            <h4 className={`font-bold mb-6 ${isDarkMode ? 'text-[#D4AC4E]' : 'text-[#2D6A4F]'}`}>Centro de Mando</h4>
            <ul className={`text-sm flex flex-col gap-4 ${isDarkMode ? 'text-[#FFEFD1]/70' : 'text-[#212529]/70'}`}>
              <li className="font-medium">📍 La Grita, Municipio Jáuregui, Edo. Táchira</li>
              <li className="font-medium">📞 0414-7599094</li>
              <li className="font-medium">✉️ soporte@sisvic.org.ve</li>
            </ul>
          </div>
        </div>
        <div className={`text-center pt-8 text-xs font-medium tracking-wide border-t ${theme.border} ${isDarkMode ? 'text-[#FFEFD1]/40' : 'text-[#212529]/40'}`}>
          © 2026 Plataforma SISCVI. Todos los derechos reservados.
        </div>
      </footer>

    </div>
  );
}

export default App;