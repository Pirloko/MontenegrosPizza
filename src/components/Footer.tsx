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
            <p className="mb-2">Av. Diego de Almagro #1059</p>
            <p>Rancagua, Chile</p>
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
                <a href="tel:+56 9 6619 5132" className="hover:text-green-500 transition-colors">
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
                  href="https://www.instagram.com/montenegrospizza/?fbclid=IwY2xjawO3EcVleHRuA2FlbQIxMABicmlkETE2eVdzeHRURUV5Y0xGbW1mc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHtFTBS3Hq3oR-z1CgLwZa1mVGT2KjfRb9qaVAcKBGzNktEd481AcWHbnlkh-_aem_QK0qnoTaRmhHZMONcpAYXw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-500 transition-colors"
                >
                  <Instagram size={24} />
                </a>
                <a 
                  href="https://www.facebook.com/profile.php?id=100057590403740&locale=es_LA" 
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
          <p className="mt-2 text-gray-400">
            Desarrollado por{' '}
            <a 
              href="https://ancodevs.cl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-green-500 transition-colors"
            >
              ancodevs.cl
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;