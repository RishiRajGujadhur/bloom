import type { Tool } from '../types'
import { area, dateField, select, textField } from '../fields'
export const boundaryRequests = [
  'Please keep work requests within my agreed working hours.',
  'Please allow me time to respond instead of sending repeated follow-ups.',
  'I cannot attend this meeting. Please share the decisions and any action needed from me.',
  'Please agree the revised scope and timeline with me before adding more work.',
  'Please arrange visits with me in advance.',
  'Please ask before entering my personal space.',
  'Please ask before borrowing my belongings and agree when to return them.',
  'I am not able to lend money. Please respect this decision.',
  'Please do not expect immediate replies when I am offline.',
  'Please let me decide what I share about my recovery.',
  'Please respect my food choices without commenting on them.',
  'Please ask whether I want assistance before moving my wheelchair or touching my equipment.',
  'Please help me reduce the noise and give me space to step away when needed.',
  'Please keep this time free from interruptions so I can be quiet.',
  'I need to rest. Please leave non-urgent requests until I am available again.',
  'I can help within the limits we agree. Please arrange additional support for the remaining needs.',
  'Please listen first and ask whether I would like advice.',
  'I need a pause in this conversation. Let us agree a calmer time to continue.',
  'I want to restate the boundary we discussed. Please follow the agreement going forward.',
  'The current arrangement is not working for me. Please help arrange a respectful conversation with the appropriate person.',
]
export const boundaryScenarios = [
  'Work hours',
  'Response times',
  'Meeting decline',
  'Scope change',
  'Family visits',
  'Personal space',
  'Lending possessions',
  'Money requests',
  'Digital availability',
  'Recovery privacy',
  'Food preferences',
  'Mobility assistance',
  'Sensory needs',
  'Quiet time',
  'Rest time',
  'Caregiving limits',
  'Unsolicited advice',
  'Conflict pause',
  'Follow-up boundary',
  'Respectful escalation',
]
export const boundaries: Tool = {
  id: 'boundaries',
  name: 'Personal boundaries',
  category: 'Connection & care',
  color: '#b87963',
  library: 'mustache (MIT)',
  description:
    'Find words that protect your time, comfort, and needs. Prepare a message privately, then choose whether to share it.',
  links: ['journal', 'mood', 'todos'],
  fields: [
    select('scenario', 'Situation', boundaryScenarios, 'Work hours'),
    textField(
      'recipient',
      'Who is this for?',
      'A name or nickname; no address needed.',
    ),
    area('context', 'What is happening?'),
    area('need', 'What do you need?'),
    area('request', 'Your clear request'),
    area('follow', 'What you will do next'),
    select('tone', 'Tone', ['Warm', 'Direct', 'Formal'], 'Warm'),
    textField('opening', 'Opening line'),
    textField('when', 'When this applies'),
    textField('alternative', 'Alternative you can offer'),
    textField('limit', 'Your limit'),
    textField(
      'reason',
      'Reason you want to share',
      'Optional. You do not have to justify a boundary.',
    ),
    textField('thanks', 'Appreciation'),
    textField('close', 'Closing line'),
    area(
      'private',
      'Private preparation notes',
      'Kept out of the generated message.',
    ),
    dateField('review', 'Review date'),
    area('response', 'Their response'),
    area('outcome', 'How it went'),
    select(
      'channel',
      'Preferred channel',
      ['In person', 'Text', 'Email', 'Phone', 'Written card'],
      'In person',
    ),
    select(
      'status',
      'Preparation stage',
      ['Draft', 'Ready', 'Shared', 'Review'],
      'Draft',
    ),
  ],
  async analyze(v) {
    const { default: Mustache } = await import('mustache')
    const request =
      v.request?.trim() ||
      boundaryRequests[Math.max(0, boundaryScenarios.indexOf(v.scenario))]
    const defaultOpen =
      v.tone === 'Formal'
        ? 'I would like to clarify something.'
        : v.tone === 'Direct'
          ? 'Here is what I need.'
          : 'I value our connection and want to be clear about something.'
    const message = Mustache.render(
      '{{{opening}}}\n{{#context}}{{{context}}}\n{{/context}}{{#need}}I need {{{need}}}.\n{{/need}}{{{request}}}\n{{#when}}This applies {{{when}}}.\n{{/when}}{{#limit}}My limit is {{{limit}}}.\n{{/limit}}{{#alternative}}What I can offer is {{{alternative}}}.\n{{/alternative}}{{#reason}}{{{reason}}}\n{{/reason}}{{#follow}}If needed, I will {{{follow}}}.\n{{/follow}}{{#thanks}}{{{thanks}}}\n{{/thanks}}{{{close}}}',
      {
        ...v,
        request,
        opening: v.opening || defaultOpen,
        close: v.close || 'Thank you for hearing me.',
      },
    ).trim()
    return {
      title: `Your ${v.scenario || 'boundary'} message`,
      lines: [
        message,
        `Prepared for ${v.channel || 'your chosen channel'}. Nothing is sent automatically.`,
      ],
      download: {
        name: 'boundary-message.txt',
        mime: 'text/plain;charset=utf-8',
        text: message,
      },
    }
  },
}
