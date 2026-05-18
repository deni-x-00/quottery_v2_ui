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

const pillars = [
  {
    icon: <HubIcon />,
    title: 'Peer-to-peer markets',
    text: 'Trade Yes or No outcome shares directly through the smart contract order book.',
  },
  {
    icon: <BalanceIcon />,
    title: 'No house edge',
    text: 'Orders match between users. Funds and shares are locked by contract rules, not by a central counterparty.',
  },
  {
    icon: <GavelIcon />,
    title: 'Dispute path',
    text: 'After the operator publishes a result, users can challenge it and Qubic computors vote on the outcome.',
  },
];

const qubicPoints = [
  {
    label: 'Smart contract',
    text: 'Market rules, order flows, settlement, and claims run through Qubic contract logic.',
  },
  {
    label: 'Computor verification',
    text: 'Disputed outcomes can be resolved by Qubic computors instead of a single source.',
  },
  {
    label: 'Asset compatibility',
    text: 'The app is designed around Qubic wallet and asset-management flows.',
  },
];

const faqItems = [
  {
    question: 'What is Quottery?',
    answer: 'Quottery is a peer-to-peer prediction market platform on Qubic. Under the interface, it runs as a smart-contract order book where users trade Yes or No shares for events with clear outcomes.',
  },
  {
    question: 'How does trading work?',
    answer: 'The contract keeps bid and ask orders for both outcomes. It supports normal buy/sell matches, minting opposite-side shares when two buyers meet, and merging opposite-side sells when two holders exit.',
  },
  {
    question: 'What is the payout?',
    answer: 'The contract uses a whole share price of 100,000. Example: if a YES share costs 10,000 and a NO share costs 90,000, the total equals 100,000. After finalization, the winning share can always be claimed for the full 100,000, while the losing share expires worthless.',
  },
  {
    question: 'What asset is used for trading?',
    answer: 'The current contract configuration uses GARTH as the managed trading asset. The code keeps it under the QUSD field as a temporary replacement until native QUSD is available.',
  },
  {
    question: 'Who creates and resolves events?',
    answer: 'The Game Operator creates events and publishes results after the event end date. Publishing a result requires a dispute deposit of 1B QUs. If there is no dispute during the dispute window of 1,000 ticks, the event can then be finalized.',
  },
  {
    question: 'What happens in a dispute?',
    answer: 'To dispute, a user calls the Dispute action for the event and posts the same 1B QUs dispute deposit before finalization. Qubic computors vote Yes or No. If the Game Operator result was wrong, the operator loses its deposit, correct computors receive their share, and the disputer receives the winner share of the deposit pot. If the Game Operator result was correct, the disputer loses its deposit, correct computors receive their share, and the Game Operator receives the winner share.',
  },
  {
    question: 'When are fees charged?',
    answer: 'Fees are charged only on value paid out by the contract, such as matched sells and winning rewards. Order placement, cancellation, and refunds are not subject to fees. The current protocol fee on these payouts is 5%. If governance changes it, this page should be updated.',
  },
  {
    question: 'Is there governance?',
    answer: 'Yes. QTRYGOV holders control protocol parameters such as operation fee, shareholder fee, burn fee, dispute deposit, daily event fee, and Game Operator address. The contract has 676 QTRYGOV tokens. Matching proposals are weighted by held tokens, and a proposal can apply when it reaches the 451 vote threshold.',
  },
  {
    question: 'What is the anti-spam cost?',
    answer: 'The contract currently uses an anti-spam amount of 11 QUs. Actions such as adding or cancelling orders must include 11 QUs. If more is sent, the extra amount is refunded by the contract; if less is sent, the action is rejected.',
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
          <a href="#protocol">Protocol</a>
          <a href="#faq">FAQ</a>
          <a href={APP_URL}>Open app</a>
        </nav>
      </header>

      <section className="mainLanding__hero">
        <div className="mainLanding__copy">
          <p className="mainLanding__eyebrow">Prediction market on QUBIC</p>
          <h1>Quottery</h1>
          <p className="mainLanding__lead">
            Peer-to-peer prediction market platform. Predict anything with a
            clear outcome. No house. No middleman. Just code.
          </p>
          <div className="mainLanding__actions">
            <a className="mainLanding__button mainLanding__button--primary" href={APP_URL}>
              Open app <ArrowOutwardIcon fontSize="small" />
            </a>
            <a className="mainLanding__button mainLanding__button--ghost" href="#faq">
              Read FAQ
            </a>
          </div>
        </div>

        <aside className="mainLanding__market" aria-label="Market mechanics preview">
          <div className="mainLanding__marketHeader">
            <span>Outcome market</span>
            <strong>YES / NO</strong>
          </div>
          <div className="mainLanding__question">
            Will the event resolve YES?
          </div>
          <div className="mainLanding__split">
            <span className="mainLanding__yes">YES 64%</span>
            <span className="mainLanding__no">NO 36%</span>
          </div>
          <dl className="mainLanding__stats">
            <div>
              <dt>Whole share</dt>
              <dd>100,000</dd>
            </div>
            <div>
              <dt>Trading asset</dt>
              <dd>GARTH</dd>
            </div>
            <div>
              <dt>Settlement</dt>
              <dd>On-chain</dd>
            </div>
            <div>
              <dt>Dispute window</dt>
              <dd>1,000 ticks</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mainLanding__section" id="protocol">
        <div className="mainLanding__sectionTitle">
          <p>Protocol</p>
          <h2>Simple interface, explicit contract rules</h2>
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
          <h2>Quottery and Qubic: a perfect match</h2>
        </div>
        <div className="mainLanding__qubicCopy">
          <p>
            Quottery is powered by the Qubic protocol. Its smart-contract order
            book handles market creation, order matching, settlement, disputes,
            and governance while staying compatible with Qubic-native wallet and
            asset flows.
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
        <h2>Start Winning Today</h2>
        <p>
          Explore decentralized prediction markets with on-chain settlement,
          transparent rules, and Qubic-native execution.
        </p>
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
          <span>powered by qubic</span>
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
