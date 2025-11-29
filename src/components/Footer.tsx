import React from 'react';
import { MapPin, Phone, Clock, Mail, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="text-white py-8" style={{ backgroundColor: '#000000' }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ubicación */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Ubicación
            </h3>
            <p className="mb-2">Av. Bernardo O'Higgins 1234</p>
            <p>La Serena, Chile</p>
          </div>

          {/* Horario */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Clock className="mr-2" size={20} />
              Horario
            </h3>
            <p className="mb-2">Lunes a Jueves: 12:00 - 23:00</p>
            <p className="mb-2">Viernes y Sábado: 12:00 - 00:00</p>
            <p>Domingo: 12:00 - 22:00</p>
          </div>

          {/* Contáctanos */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contáctanos</h3>
            <div className="space-y-3">
              {/* Teléfono */}
              <div className="flex items-center">
                <Phone className="mr-2" size={20} />
                <a href="tel:+56923736818" className="hover:text-green-500 transition-colors">
                  +56 9 2373 6818
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center">
                <Mail className="mr-2" size={20} />
                <a href="mailto:contacto@montenegros.cl" className="hover:text-green-500 transition-colors">
                  contacto@montenegros.cl
                </a>
              </div>

              {/* Redes Sociales */}
              <div className="flex items-center space-x-4 mt-4">
                <a 
                  href="https://instagram.com/montenegros" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-500 transition-colors"
                >
                  <Instagram size={24} />
                </a>
                <a 
                  href="https://facebook.com/montenegros" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-500 transition-colors"
                >
                  <Facebook size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-gray-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Montenegro's Pizza. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;