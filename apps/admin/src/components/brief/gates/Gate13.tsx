import { useId } from 'react'
import type { BriefData, ContactRow } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'

const CONTACT_TYPES_SLAYR = ['SlayR', 'Production', 'Creative', 'Technical', 'Other']
const CONTACT_TYPES_EXT = ['Client', 'Venue', 'Safety', 'Security', 'Medical', 'Artist', 'Sponsor', 'Other']

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

function ContactTable({ contacts, onUpdate, onAdd, onRemove, types }: {
  contacts: ContactRow[]
  onUpdate: (id: string, field: keyof ContactRow, value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  types: string[]
}) {
  const fi = 'w-full px-2 py-1.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none'
  const fs = 'w-full px-2 py-1.5 bg-transparent text-sm text-foreground focus:outline-none appearance-none'

  return (
    <div className="mb-4">
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid bg-secondary border-b-2 border-foreground" style={{ gridTemplateColumns: '1fr 1fr 1fr 120px 32px' }}>
          {['Name', 'Role', 'Contact / Email', 'Type', ''].map(h => (
            <div key={h} className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</div>
          ))}
        </div>
        {contacts.map((c, i) => (
          <div key={c.id} className={`grid items-center border-b border-border last:border-0`} style={{ gridTemplateColumns: '1fr 1fr 1fr 120px 32px' }}>
            <div className="border-r border-border"><input className={fi} placeholder="Full name" value={c.name} onChange={e => onUpdate(c.id, 'name', e.target.value)} /></div>
            <div className="border-r border-border"><input className={fi} placeholder="Role / Department" value={c.role} onChange={e => onUpdate(c.id, 'role', e.target.value)} /></div>
            <div className="border-r border-border"><input className={fi} placeholder="Email or phone" value={c.contact} onChange={e => onUpdate(c.id, 'contact', e.target.value)} /></div>
            <div className="border-r border-border">
              <select className={fs} value={c.type} onChange={e => onUpdate(c.id, 'type', e.target.value)}>
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => contacts.length > 1 && onRemove(c.id)} className="flex items-center justify-center text-muted-foreground hover:text-destructive text-lg h-full">×</button>
            <div className="sr-only">{i}</div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className="mt-2 text-xs font-semibold text-primary hover:opacity-70 transition-opacity">+ Add contact</button>
    </div>
  )
}

export default function Gate13({ data, update }: Props) {
  const uid = useId()
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'

  const updateSlayr = (id: string, field: keyof ContactRow, value: string) =>
    update('slayrContacts', data.slayrContacts.map(c => c.id === id ? { ...c, [field]: value } : c))
  const updateExt = (id: string, field: keyof ContactRow, value: string) =>
    update('extContacts', data.extContacts.map(c => c.id === id ? { ...c, [field]: value } : c))

  return (
    <div>
      <GateHero gateNum="13" section="Sign-off" title="Key Contacts" subtitle="All key people for this production — SlayR team, client contacts, and external partners." />
      <div className="px-12 py-8">
        <SectionDivider label="SlayR team contacts" />
        <ContactTable
          contacts={data.slayrContacts}
          onUpdate={updateSlayr}
          onAdd={() => update('slayrContacts', [...data.slayrContacts, { id: uid + Date.now(), name: '', role: '', contact: '', type: 'SlayR' }])}
          onRemove={id => update('slayrContacts', data.slayrContacts.filter(c => c.id !== id))}
          types={CONTACT_TYPES_SLAYR}
        />

        <SectionDivider label="Client & external contacts" />
        <ContactTable
          contacts={data.extContacts}
          onUpdate={updateExt}
          onAdd={() => update('extContacts', [...data.extContacts, { id: uid + Date.now(), name: '', role: '', contact: '', type: 'Client' }])}
          onRemove={id => update('extContacts', data.extContacts.filter(c => c.id !== id))}
          types={CONTACT_TYPES_EXT}
        />

        <SectionDivider label="On-day radio / comms assignments" />
        <div className="grid grid-cols-3 gap-4">
          {[
            ['radioEventDirector', 'Event Director'],
            ['radioStageManager', 'Stage Manager'],
            ['radioSecurityLead', 'Security Lead'],
            ['radioTechLead', 'Technical Lead'],
            ['radioMedicalLead', 'Medical Lead'],
            ['radioArtistLiaison', 'Artist Liaison'],
          ].map(([key, label]) => (
            <div key={key} className="flex flex-col">
              <label className={fl}>{label}</label>
              <input className={fi} value={data[key as keyof BriefData] as string} onChange={e => update(key as keyof BriefData, e.target.value)} placeholder="Name — Radio channel / number" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
