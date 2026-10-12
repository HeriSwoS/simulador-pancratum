import { Crown, Shield, Swords, Skull, Sparkles, Layers3 } from 'lucide-react'

const five = Array.from({ length: 5 })

export function BoardPreview({ className = '' }: { className?: string }) {
  return (
    <div className={`board-preview ${className}`} aria-label="Prévia do tabuleiro PANCRATUM">
      <div className="preview-left">
        {[1, 2, 3].map((n) => (
          <div className="preview-zone legendary" key={n}>
            <Crown />
            <span>LENDÁRIA {n}</span>
          </div>
        ))}
      </div>
      <div className="preview-center">
        <div className="preview-row">
          {five.map((_, i) => (
            <div className="preview-zone attack" key={i}>
              <Swords />
              <span>ZONA DE ATAQUE</span>
            </div>
          ))}
        </div>
        <div className="preview-row">
          {five.map((_, i) => (
            <div className="preview-zone defense" key={i}>
              <Shield />
              <span>ZONA DE DEFESA</span>
            </div>
          ))}
        </div>
        <div className="preview-row">
          {[
            'EQUIPAMENTO 1',
            'EQUIPAMENTO 2',
            'PERSONAGEM PRINCIPAL',
            'EQUIPAMENTO 3',
            'EQUIPAMENTO 4',
          ].map((label, i) => (
            <div className="preview-zone equipment" key={label}>
              {i === 2 ? <Crown /> : <Sparkles />}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="preview-right">
        <div className="preview-zone banishment">
          <Sparkles />
          <span>BANIMENTO</span>
        </div>
        <div className="preview-zone resource">
          <Sparkles />
          <span>RECURSOS</span>
        </div>
        <div className="preview-zone resource">
          <Skull />
          <span>CEMITÉRIO</span>
        </div>
        <div className="preview-zone resource">
          <Layers3 />
          <span>BARALHO</span>
        </div>
      </div>
    </div>
  )
}
