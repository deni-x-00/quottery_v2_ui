import React from 'react';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import BalanceIcon from '@mui/icons-material/Balance';
import GavelIcon from '@mui/icons-material/Gavel';
import HubIcon from '@mui/icons-material/Hub';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { FaDiscord, FaXTwitter } from 'react-icons/fa6';
import quotteryLogo from '../assets/quottery.svg';
import './MainLanding.css';

const APP_URL = 'https://app.quottery.org';
const X_URL = 'https://x.com/QUOTTERY1';
const DISCORD_URL = 'https://discord.gg/5WNEHjEFpf';
const TERMS_URL = 'https://qubic.org/terms-of-service';
const PRIVACY_URL = 'https://qubic.org/privacy-policy';

const heroStats = [
  { label: 'Whole share', value: '100,000' },
  { label: 'Trading asset', value: 'GARTH' },
  { label: 'Settlement', value: 'On-chain' },
];

const pillars = [
  {
    icon: <HubIcon />,
    title: 'Peer-to-peer order book',
    text: 'Trade YES or NO outcome shares through smart-contract bids, asks, matches, and settlement.',
  },
  {
    icon: <BalanceIcon />,
    title: 'Transparent mechanics',
    text: 'Prices, volume, open orders, positions, transfers, and payouts are indexed from Qubic data.',
  },
  {
    icon: <GavelIcon />,
    title: 'Resolution path',
    text: 'Operators publish outcomes, users can dispute within the protocol window, and final claims settle on-chain.',
  },
];

const qubicPoints = [
  {
    label: 'Smart contract execution',
    text: 'Market creation, order matching, finalization, claims, and governance actions run through Qubic contract logic.',
  },
  {
    label: 'Index-backed interface',
    text: 'The app reads decoded events from the database so markets, portfolios, and archives stay fast to inspect.',
  },
  {
    label: 'Wallet-native flows',
    text: 'Trading, reward claiming, transfers, and governance actions stay tied to the connected Qubic identity.',
  },
];

const faqItems = [
  {
    question: 'What is Quottery?',
    answer: 'Quottery is a Qubic-native peer-to-peer prediction market. Users trade YES and NO outcome shares on events with clear resolution rules.',
  },
  {
    question: 'How does trading work?',
    answer: 'The contract keeps bid and ask orders for both outcomes. It supports direct matches, opposite-side share creation, and exits through sell-side liquidity.',
  },
  {
    question: 'How is price displayed?',
    answer: 'The contract uses a whole share price of 100,000. A price of 45,000 is displayed as 45%, and the opposite side is priced against the same 100,000 invariant.',
  },
  {
    question: 'What asset is used for trading?',
    answer: 'The current contract configuration uses GARTH as the managed trading asset. The code still maps it through the historical QUSD field until native QUSD is available.',
  },
  {
    question: 'Who creates and resolves events?',
    answer: 'The Game Operator creates events and publishes results after the event end date. Publishing requires the protocol dispute deposit, then finalization can happen after the dispute window.',
  },
  {
    question: 'When are fees charged?',
    answer: 'Fees are charged on value paid out by the contract, such as matched sells and winning rewards. Order placement, cancellation, and returned funds are not subject to the operation fee.',
  },
];

function MainLanding() {
  return (
    <main className="mainLanding">
      <header className="mainLanding__header">
        <a className="mainLanding__brand" href="/" aria-label="Quottery">
          <img src={quotteryLogo} alt="" />
          <span>Quottery</span>
        </a>
        <nav className="mainLanding__nav" aria-label="Primary navigation">
          <a href="#markets">Markets</a>
          <a href="#protocol">Protocol</a>
          <a href="#faq">FAQ</a>
          <a className="mainLanding__navCta" href={APP_URL}>Open app</a>
        </nav>
      </header>

      <section className="mainLanding__hero">
        <div className="mainLanding__copy">
          <p className="mainLanding__eyebrow">
            <span aria-hidden="true" />
            Qubic-native prediction markets
          </p>
          <h1>
            Trade the <span>outcome</span>
          </h1>
          <p className="mainLanding__lead">
            Quottery is a peer-to-peer market for trading YES and NO outcomes
            with transparent order books, indexed portfolios, and on-chain
            settlement.
          </p>
          <div className="mainLanding__actions">
            <a className="mainLanding__button mainLanding__button--primary" href={APP_URL}>
              Explore Markets <ArrowOutwardIcon fontSize="small" />
            </a>
            <a className="mainLanding__button mainLanding__button--ghost" href="#protocol">
              View Protocol
            </a>
          </div>
          <dl className="mainLanding__heroStats" aria-label="Protocol facts">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="mainLanding__market" id="markets" aria-label="Market preview">
          <div className="mainLanding__marketTop">
            <span>Featured market</span>
            <strong>Open</strong>
          </div>
          <div className="mainLanding__marketQuestion">
            Will QUBIC close above $1111/bQUBIC on May 31, 2026?
          </div>
          <div className="mainLanding__outcomes" aria-label="Outcome prices">
            <div className="mainLanding__outcome mainLanding__outcome--yes">
              <span>YES</span>
              <strong>57.5%</strong>
            </div>
            <div className="mainLanding__outcome mainLanding__outcome--no">
              <span>NO</span>
              <strong>42.5%</strong>
            </div>
          </div>
          <div className="mainLanding__depth" aria-hidden="true">
            <span style={{ width: '58%' }} />
            <span style={{ width: '42%' }} />
          </div>
          <div className="mainLanding__marketMeta">
            <span>Traded volume <strong>12M</strong></span>
            <span>Open orders <strong>1.7M</strong></span>
          </div>
        </aside>
      </section>

      <section className="mainLanding__section" id="protocol">
        <div className="mainLanding__sectionTitle">
          <p>Protocol</p>
          <h2>Clear market mechanics, visible at every step</h2>
        </div>
        <div className="mainLanding__pillars">
          {pillars.map((item) => (
            <article key={item.title}>
              {item.icon}
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mainLanding__qubic" id="qubic">
        <div className="mainLanding__qubicHeader">
          <p>Built on Qubic</p>
          <h2>On-chain settlement with an indexed interface</h2>
        </div>
        <div className="mainLanding__qubicCopy">
          <p>
            Quottery combines Qubic smart-contract execution with a live indexer
            for readable market history, portfolio state, trades, transfers,
            archives, and rewards.
          </p>
          <a href="https://qubic.org" target="_blank" rel="noreferrer">
            Learn Qubic <ArrowOutwardIcon fontSize="small" />
          </a>
        </div>
        <ul className="mainLanding__qubicList">
          {qubicPoints.map((point) => (
            <li key={point.label}>
              <span>{point.label}</span>
              <p>{point.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mainLanding__faq" id="faq">
        <div className="mainLanding__sectionTitle">
          <p>FAQ</p>
          <h2>What to know before opening the app</h2>
        </div>
        <div className="mainLanding__faqList">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>
                <span>{item.question}</span>
                <ShieldOutlinedIcon fontSize="small" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mainLanding__cta">
        <p>Start with live markets</p>
        <h2>Explore active outcome markets on Qubic</h2>
        <a className="mainLanding__button mainLanding__button--primary" href={APP_URL}>
          Open Quottery <ArrowOutwardIcon fontSize="small" />
        </a>
      </section>

      <footer className="mainLanding__footer">
        <div className="mainLanding__footerBrand">
          <div className="mainLanding__footerLogo">
            <img src={quotteryLogo} alt="" />
            <strong>Quottery</strong>
          </div>
          <span>powered by Qubic</span>
        </div>
        <div className="mainLanding__socials" aria-label="Social links">
          <a href={X_URL} target="_blank" rel="noreferrer" aria-label="Quottery on X">
            <FaXTwitter />
          </a>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" aria-label="Quottery Discord">
            <FaDiscord />
          </a>
        </div>
        <nav className="mainLanding__footerLinks" aria-label="Footer links">
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacy Policy</a>
          <a href={TERMS_URL} target="_blank" rel="noreferrer">Terms of Service</a>
        </nav>
      </footer>
    </main>
  );
}

export default MainLanding;
