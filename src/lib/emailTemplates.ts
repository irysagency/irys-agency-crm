export interface EmailTemplate {
  id: string
  label: string
  objet: string
  corps: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'relance_j7',
    label: 'Relance J+7',
    objet: 'Re: Collaboration — {{prénom}}',
    corps: `Bonjour {{prénom}},

Je me permets de revenir vers toi suite à mon message de la semaine dernière.

Je sais que tu dois recevoir beaucoup de messages, mais je pense vraiment que ce qu'on fait chez Irys Agency pourrait t'apporter une vraie valeur ajoutée.

Est-ce qu'on pourrait prendre 15 minutes cette semaine pour en discuter ?

Belle journée,`,
  },
  {
    id: 'relance_j14',
    label: 'Relance J+14',
    objet: 'Dernière relance — {{prénom}}',
    corps: `Bonjour {{prénom}},

Je reviens une dernière fois vers toi — promis, c'est ma dernière tentative !

J'ai l'impression que mon message est peut-être passé entre les mailles. Je comprends, les DMs débordent.

Si tu es ouvert(e) à une collaboration à un moment, tu sais où me trouver. Sinon, pas de souci du tout.

Bonne continuation,`,
  },
  {
    id: 'relance_j21',
    label: 'Relance J+21',
    objet: 'On repart de zéro ? — {{prénom}}',
    corps: `Bonjour {{prénom}},

Ça fait maintenant 3 semaines que je t'ai contacté pour la première fois.

Je ne veux pas insister, mais je crois vraiment en ce que je pourrais t'apporter. Si le timing n'est pas le bon maintenant, c'est tout à fait normal.

N'hésite pas à me recontacter quand tu seras prêt(e). Je reste disponible.

Cordialement,`,
  },
]

export function applyTemplate(template: EmailTemplate, prenom: string): EmailTemplate {
  const replace = (s: string) => s.replaceAll('{{prénom}}', prenom)
  return {
    ...template,
    objet: replace(template.objet),
    corps: replace(template.corps),
  }
}
