import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Header />
            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl md:text-4xl font-serif text-primary mb-8 text-center">Aviso de Privacidad</h1>

                <div className="space-y-6 text-gray-300 leading-relaxed font-light text-justify">
                    <p>
                        En cumplimiento con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</strong>,
                        <strong> Blue Velvet Florería</strong> (en adelante "La Empresa"), con domicilio en Chihuahua, Chihuahua, México,
                        hace de su conocimiento que los datos personales que se recaban de usted serán utilizados para las siguientes finalidades.
                    </p>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">1. Datos Personales Recabados</h2>
                    <p>
                        Para la prestación de nuestros servicios, podemos recabar los siguientes datos personales:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Nombre completo del cliente y del destinatario.</li>
                        <li>Dirección de entrega (Calle, número, colonia, código postal, ciudad).</li>
                        <li>Teléfonos de contacto (Móvil y Fijo).</li>
                        <li>Correo electrónico.</li>
                        <li>Datos de facturación (RFC, Razón Social).</li>
                        <li>Mensajes personales para las tarjetas de regalo.</li>
                    </ul>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">2. Finalidad del Tratamiento de Datos</h2>
                    <p>
                        Sus datos personales serán utilizados para:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Procesar, confirmar y entregar sus pedidos de arreglos florales y regalos.</li>
                        <li>Procesar pagos a través de nuestros proveedores de pasarelas de pago seguros (ej. MercadoPago).</li>
                        <li>Emitir comprobantes fiscales (Facturas) cuando sea solicitado.</li>
                        <li>Mantenerlo informado sobre el estatus de su pedido.</li>
                    </ul>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">3. Transferencia de Datos</h2>
                    <p>
                        Sus datos no serán transferidos a terceros ajenos a la operación del servicio, salvo a proveedores de servicios
                        de pago (para procesar su tarjeta) o servicios de mensajería externos si fuera necesario para completar la entrega.
                        Nunca venderemos ni rentaremos su información a terceros.
                    </p>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">4. Derechos ARCO</h2>
                    <p>
                        Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso).
                        Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación);
                        que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada conforme a los principios, deberes y obligaciones previstas en la normativa (Cancelación);
                        así como oponerse al uso de sus datos personales para fines específicos (Oposición).
                    </p>
                    <p>
                        Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva a través de nuestro correo electrónico de contacto o vía WhatsApp.
                    </p>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">5. Seguridad</h2>
                    <p>
                        Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado.
                    </p>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">6. Cambios al Aviso de Privacidad</h2>
                    <p>
                        Nos reservamos el derecho de efectuar en cualquier momento modificaciones o actualizaciones al presente aviso de privacidad, para la atención de novedades legislativas o políticas internas.
                        Estas modificaciones estarán disponibles al público a través de nuestra página web.
                    </p>

                    <p className="mt-12 text-sm text-gray-500 text-center">
                        Última actualización: Enero 2026.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
