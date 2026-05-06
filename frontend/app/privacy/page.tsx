import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-6 py-12" style={{ background: '#000000', color: '#ffffff' }}>
      <div className="max-w-2xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center mb-8 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: '#bc19eb' }}
        >
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-8" style={{ color: '#ffffff' }}>
          Política de Privacidad
        </h1>

        <div className="space-y-8" style={{ color: '#aaaaaa' }}>
          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              1. Información que recopilamos
            </h2>
            <p className="leading-relaxed">
              Para brindarte un servicio de reserva eficiente, recopilamos la siguiente información personal:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Nombre completo.</li>
              <li>Número de teléfono (utilizado para vincular tu cuenta con WhatsApp).</li>
              <li>Historial de citas y servicios solicitados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              2. Cómo utilizamos tu información
            </h2>
            <p className="leading-relaxed">
              Utilizamos los datos recopilados exclusivamente para:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Confirmar y gestionar tus turnos de barbería.</li>
              <li>Enviar recordatorios automáticos de tus citas a través de WhatsApp.</li>
              <li>Comunicar promociones especiales y novedades del negocio (solo si has dado tu consentimiento).</li>
              <li>Mejorar la experiencia de usuario en nuestra plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              3. Compartición de datos con terceros
            </h2>
            <p className="leading-relaxed">
              No vendemos tus datos a terceros. Sin embargo, para el funcionamiento de nuestras notificaciones, integramos los siguientes servicios:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>
                <strong>Meta (WhatsApp Cloud API):</strong> Compartimos tu número de teléfono y detalles de la cita con Meta para procesar el envío de mensajes de confirmación y recordatorios.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              4. Protección de la información
            </h2>
            <p className="leading-relaxed">
              Implementamos medidas de seguridad técnicas para proteger tus datos personales contra acceso no autorizado, alteración o destrucción.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              5. Tus derechos
            </h2>
            <p className="leading-relaxed">
              Tienes derecho a acceder, rectificar o solicitar la eliminación de tus datos personales en cualquier momento. Para ejercer estos derechos, puedes contactarnos a través de nuestros canales oficiales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              6. Cambios en esta política
            </h2>
            <p className="leading-relaxed">
              Podemos actualizar esta política ocasionalmente. Te recomendamos revisarla periódicamente para estar informado sobre cómo protegemos tu información.
            </p>
          </section>

          <section className="pt-8 border-t" style={{ borderColor: '#333333' }}>
            <p className="text-sm">
              Última actualización: Mayo 2024
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
