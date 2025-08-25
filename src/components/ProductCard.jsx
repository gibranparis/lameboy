import Image from 'next/image';

export default function ProductCard({ product }) {
  const img = product?.images?.[0]?.file?.url || null;
  return (
    <a className="card" href={`/shop/${product.slug}`}>
      {img && (
        <div style={{ position:'relative', width:'100%', aspectRatio:'1/1' }}>
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize:14 }}>{product.name}</div>
        <div className="price">${Number(product.price || 0).toFixed(2)}</div>
      </div>
    </a>
  );
}
