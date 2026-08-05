import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsOfService = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Header />
            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl md:text-4xl font-serif text-primary mb-8 text-center">Términos y Condiciones</h1>

                <div className="space-y-6 text-gray-300 leading-relaxed font-light text-justify">
                    <p>
                        Al momento de comprar cualquiera de nuestros productos el cliente acepta los términos, condiciones y políticas de entrega que se especifican a continuación:
                    </p>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">1. CONFIDENCIALIDAD</h2>
                    <p>
                        Nos comprometemos a mantener privacidad de toda la información que nos proporcionan, nuestra intención es que tenga toda la confianza y se sienta seguro de realizar una compra con nosotros, ya que requerimos información personal como nombres, direcciones, teléfonos, etc. en los cuales nos comprometemos a darle uso confidencial.
                    </p>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">2. COMPRA</h2>
                    <p>
                        El cliente tiene que liquidar el arreglo en su totalidad antes de ser enviado.
                    </p>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">3. ENVÍOS</h2>
                    <p>
                        El costo será gratuito dentro de la zona operable, si sale de la zona se podrá cobrar un extra en el envío.
                        Para garantizar un mejor servicio, el cliente deberá proporcionar un rango de horario de entrega (mínimo 5 horas después de que el pedido sea agendado).
                        Se da por entendido que es responsabilidad del cliente verificar que el destinatario se encuentre en esos horarios.
                    </p>
                    <p className="mt-4 font-medium text-white">De no encontrarse el destinatario, el repartidor seguirá el siguiente procedimiento:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Se le notificará al cliente.</li>
                        <li>Esperará 10 minutos para la entrega y de no poder concretarse, el repartidor regresará al taller con el pedido.</li>
                        <li>El cliente podrá pasar a recoger su pedido o tendrá la posibilidad de agendar otro envío a domicilio (con costo extra).</li>
                    </ul>

                    <h2 className="text-xl font-serif text-white mt-8 mb-4">4. CANCELACIONES</h2>
                    <p>
                        Debido a la naturaleza de nuestro producto, no existe ningún tipo de cancelación ni cabios de fecha de entrega si el pedido ya fue elaborado.
                    </p>

                    <p className="mt-12 text-sm text-gray-500 text-center">
                        Blue Velvet Florería se reserva el derecho de modificar estos términos sin previo aviso.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
