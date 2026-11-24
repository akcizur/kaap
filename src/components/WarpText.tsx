import type { CSSProperties } from 'react'

type WarpTextProps = {
  text: string
}

type WarpStyle = CSSProperties & {
  '--x': string
  '--y': string
  '--z': string
  '--rx': string
  '--ry': string
  '--rz': string
  '--s': string
  '--d': string
}

function getWarpStyle(characterIndex: number, wordIndex: number): WarpStyle {
  // Deterministic golden-angle distribution: the same glyph always follows
  // the same path, so React renders never reshuffle the motion.
  const angle = ((characterIndex * 137.508 + wordIndex * 53.2) % 360) * Math.PI / 180
  const distance = 24 + ((characterIndex * 19 + wordIndex * 11) % 46)
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance
  const z = 34 + ((characterIndex * 29 + wordIndex * 17) % 92)
  const rotateX = -72 + ((characterIndex * 37 + wordIndex * 23) % 144)
  const rotateY = -78 + ((characterIndex * 47 + wordIndex * 31) % 156)
  const rotateZ = -32 + ((characterIndex * 17 + wordIndex * 13) % 64)
  const scale = .42 + ((characterIndex * 7 + wordIndex * 3) % 48) / 100
  const delay = Math.min(280, wordIndex * 34 + (characterIndex % 8) * 17)

  return {
    '--x': x.toFixed(1) + 'px',
    '--y': y.toFixed(1) + 'px',
    '--z': z + 'px',
    '--rx': rotateX + 'deg',
    '--ry': rotateY + 'deg',
    '--rz': rotateZ + 'deg',
    '--s': scale.toFixed(2),
    '--d': delay + 'ms',
  }
}

export function WarpText({ text }: WarpTextProps) {
  let wordIndex = 0

  return (
    <>
      {text.split(/(\s+)/u).map((part, partIndex) => {
        if (!part) return null
        if (/^\s+$/u.test(part)) return part

        const currentWordIndex = wordIndex
        wordIndex += 1

        return (
          <span className="slovo" aria-hidden="true" key={partIndex}>
            {Array.from(part).map((character, characterIndex) => (
              <span
                key={characterIndex}
                style={getWarpStyle(characterIndex, currentWordIndex)}
              >
                {character}
              </span>
            ))}
          </span>
        )
      })}
    </>
  )
}
