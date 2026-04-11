export default async function ProductoDetallePage({ params }) {
  const { slug } = await params;

  return (
    <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Detalle de Producto</h1>
      <p>Producto: <strong>{slug}</strong></p>
    </section>
  );
}
