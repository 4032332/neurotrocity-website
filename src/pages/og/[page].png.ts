import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { HOME, REWIRE_PAGE } from '../../content/copy';

const FONT_DIR = path.join(process.cwd(), 'public/assets/fonts');
const titleFont = fs.readFileSync(path.join(FONT_DIR, 'Manrope-ExtraBold.ttf'));
const monoFont = fs.readFileSync(path.join(FONT_DIR, 'IBMPlexMono-Medium.ttf'));

type Card = { title: string; eyebrow: string; accent: string };

const CARDS: Record<string, Card> = {
  home: {
    title: HOME.meta.title,
    eyebrow: HOME.hero.kicker.toUpperCase(),
    accent: '#7C6BFF',
  },
  rewire: {
    title: REWIRE_PAGE.meta.title,
    eyebrow: REWIRE_PAGE.hero.kicker.toUpperCase(),
    accent: '#22C489',
  },
};

export function getStaticPaths() {
  return Object.keys(CARDS).map((page) => ({ params: { page } }));
}

function cardMarkup({ title, eyebrow, accent }: Card) {
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        background: '#07060E',
        padding: '72px',
        fontFamily: 'Manrope',
      },
      children: [
        // abstract brand backdrop
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0, left: 0, width: '1200px', height: '630px',
              display: 'flex',
              backgroundImage:
                `radial-gradient(circle at 8% 4%, ${accent}59 0%, transparent 42%), ` +
                `radial-gradient(circle at 92% 12%, #38E1D64D 0%, transparent 40%), ` +
                `radial-gradient(circle at 68% 100%, #FF8A4C40 0%, transparent 48%)`,
            },
            children: [],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0, left: 0, width: '1200px', height: '630px',
              display: 'flex',
              backgroundImage: `linear-gradient(115deg, transparent 30%, ${accent}26 42%, transparent 44%, transparent 62%, ${accent}1F 70%, transparent 72%)`,
            },
            children: [],
          },
        },
        // mark
        {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', position: 'relative' },
            children: [
              { type: 'span', props: { style: { color: '#EFEEF7' }, children: 'Neuro' } },
              { type: 'span', props: { style: { color: '#7C6BFF' }, children: 'Trocity' } },
            ],
          },
        },
        // headline block
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', position: 'relative' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '20px',
                    letterSpacing: '0.16em',
                    color: accent,
                    marginBottom: '22px',
                  },
                  children: eyebrow,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '56px',
                    fontWeight: 800,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    color: '#EFEEF7',
                    maxWidth: '980px',
                  },
                  children: title,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const GET: APIRoute = async ({ params }) => {
  const card = CARDS[params.page as string];
  if (!card) return new Response('Not found', { status: 404 });

  const svg = await satori(cardMarkup(card) as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Manrope', data: titleFont, weight: 800, style: 'normal' },
      { name: 'IBM Plex Mono', data: monoFont, weight: 500, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
