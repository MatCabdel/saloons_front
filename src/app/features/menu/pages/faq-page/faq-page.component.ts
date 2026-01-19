import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/common/components/header/header.component';

type FaqQuestion = {
  question: string;
  answer: string;
  isOpen: boolean;
};

type FaqSection = {
  title: string;
  icon: string;
  isOpen: boolean;
  questions: FaqQuestion[];
};

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.scss'],
})
export class FaqPageComponent {
  faqSections = signal<FaqSection[]>([
    {
      title: 'Général',
      icon: '💡',
      isOpen: false,
      questions: [
        {
          question: "Qu'est-ce que Saloons ?",
          answer: "Saloons est une application sociale géolocalisée qui permet de rencontrer des personnes dans des lieux réels, comme des bars, événements, facs ou lieux publics. L'objectif est de créer des échanges naturels, que ce soit pour discuter, se faire des amis ou plus, selon les affinités.",
          isOpen: false
        },
        {
          question: "Saloons est-ce une application de rencontre ?",
          answer: "Saloons n'est pas une application de swipe classique. C'est avant tout un réseau social local, basé sur la présence dans un même lieu. Les rencontres peuvent être amicales ou sentimentales, mais elles se font dans un cadre réel et partagé.",
          isOpen: false
        },
        {
          question: "À qui s'adresse l'application ?",
          answer: "Saloons s'adresse à toutes les personnes qui souhaitent : rencontrer du monde dans des lieux réels, discuter sans pression, élargir leur cercle social, ou simplement passer un bon moment. L'application est pensée pour être inclusive, respectueuse et accessible.",
          isOpen: false
        },
        {
          question: "Puis-je utiliser Saloons en groupe ou entre amis ?",
          answer: "Oui. Saloons fonctionne très bien en groupe. Beaucoup d'utilisateurs l'utilisent entre amis pour discuter avec d'autres groupes présents dans le même lieu.",
          isOpen: false
        }
      ]
    },
    {
      title: 'Saloons & carte',
      icon: '📍',
      isOpen: false,
      questions: [
        {
          question: "Qu'est-ce qu'un saloon ?",
          answer: "Un saloon est un lieu réel ou un événement (bar, soirée, fac, parc, événement privé…) associé à un espace social virtuel temporaire dans l'application.",
          isOpen: false
        },
        {
          question: "Comment rejoindre un saloon ?",
          answer: "Il suffit d'ouvrir la carte, sélectionner un lieu, et entrer dans le saloon si les conditions sont remplies.",
          isOpen: false
        },
        {
          question: "Combien de temps puis-je rester dans un saloon ?",
          answer: "La durée standard est limitée à 3 heures par saloon, afin de garantir des échanges dynamiques et éviter les abus.",
          isOpen: false
        },
        {
          question: "Pourquoi je ne peux rejoindre qu'un nombre limité de saloons par jour ?",
          answer: "Cette limite permet d'éviter les comportements intrusifs, de favoriser des échanges plus qualitatifs, et de maintenir une ambiance saine dans les saloons.",
          isOpen: false
        },
        {
          question: "Que se passe-t-il quand mon temps est écoulé ?",
          answer: "Lorsque ton temps est terminé, tu quittes automatiquement le saloon et l'accès au chat et aux profils du saloon est fermé. Tu peux rejoindre un autre saloon selon les règles en vigueur.",
          isOpen: false
        },
        {
          question: "Puis-je créer mon propre saloon ?",
          answer: "Oui, certaines fonctionnalités permettent de créer des saloons éphémères, par exemple pour un anniversaire, un mariage ou un événement privé (selon les options disponibles).",
          isOpen: false
        }
      ]
    },
    {
      title: 'Chat & interactions',
      icon: '💬',
      isOpen: false,
      questions: [
        {
          question: "Comment fonctionne le chat dans un saloon ?",
          answer: "Le chat est un chat collectif, accessible aux personnes présentes dans le saloon. Il est conçu pour favoriser les échanges de groupe, pas les discussions privées déguisées.",
          isOpen: false
        },
        {
          question: "Pourquoi le chat n'est-il pas toujours actif ?",
          answer: "Le chat s'active lorsqu'il y a suffisamment de participants dans le saloon. Cela permet d'éviter les conversations à deux dans un espace public.",
          isOpen: false
        },
        {
          question: "Pourquoi le chat s'active à partir de plusieurs participants ?",
          answer: "À partir de 3 participants, l'échange devient naturellement collectif. Cela contribue à une ambiance plus conviviale et limite les comportements ciblés ou intrusifs.",
          isOpen: false
        },
        {
          question: "Est-ce que le chat est privé ?",
          answer: "Non. Le chat de saloon est public et visible par tous les participants du saloon. Pour des échanges privés, d'autres mécanismes existent selon les interactions.",
          isOpen: false
        },
        {
          question: "Est-ce que je peux discuter avec une seule personne ?",
          answer: "Oui, mais uniquement via des interactions volontaires et mutuelles. Le chat public n'est pas destiné aux discussions privées.",
          isOpen: false
        }
      ]
    },
    {
      title: 'Rencontres & respect',
      icon: '🤝',
      isOpen: false,
      questions: [
        {
          question: "Voir quelqu'un dans un saloon signifie-t-il que je peux aller lui parler ?",
          answer: "Non. La présence dans un saloon ne vaut pas consentement à une interaction réelle. Toute approche physique doit être précédée d'un signal clair dans l'application (interaction, clin d'œil, échange).",
          isOpen: false
        },
        {
          question: "Comment signaler mon intérêt pour quelqu'un ?",
          answer: "Tu peux utiliser les outils proposés dans l'application (interaction, message, clin d'œil) pour montrer ton intérêt de manière respectueuse.",
          isOpen: false
        },
        {
          question: "Que faire si je ne souhaite pas être abordé(e) ?",
          answer: "Tu peux ignorer une interaction, bloquer un utilisateur, ou signaler un comportement si nécessaire. Tu restes toujours maître de tes échanges.",
          isOpen: false
        },
        {
          question: "Que faire si quelqu'un se comporte de manière inappropriée ?",
          answer: "Un bouton de signalement est disponible sur les profils et dans les échanges. Les comportements irrespectueux ou non consentis sont pris très au sérieux.",
          isOpen: false
        },
        {
          question: "Saloons est-elle une application sûre pour les femmes ?",
          answer: "Oui. L'application a été conçue avec des règles claires, des limites d'usage et des outils de signalement afin de créer un environnement plus sûr et respectueux.",
          isOpen: false
        }
      ]
    },
    {
      title: 'Sécurité & modération',
      icon: '🛡️',
      isOpen: false,
      questions: [
        {
          question: "Comment Saloons lutte contre les comportements relous ?",
          answer: "Saloons combine des limites d'usage, des règles explicites, des avertissements progressifs, et des sanctions en cas d'abus. La prévention est au cœur du fonctionnement.",
          isOpen: false
        },
        {
          question: "Comment signaler un utilisateur ?",
          answer: "Depuis un profil ou un échange, tu peux signaler un comportement en quelques clics.",
          isOpen: false
        },
        {
          question: "Que se passe-t-il après un signalement ?",
          answer: "Chaque signalement est analysé. Selon la situation, cela peut entraîner un avertissement, des restrictions temporaires, ou un bannissement.",
          isOpen: false
        },
        {
          question: "Les comportements physiques non consentis sont-ils sanctionnés ?",
          answer: "Oui. Toute approche physique non consentie est considérée comme un comportement grave et peut entraîner une exclusion immédiate.",
          isOpen: false
        }
      ]
    },
    {
      title: 'Compte & données',
      icon: '🔒',
      isOpen: false,
      questions: [
        {
          question: "Quelles informations sont visibles par les autres utilisateurs ?",
          answer: "Seules les informations que tu choisis de rendre visibles dans ton profil (photo, pseudo, bio) sont accessibles aux autres utilisateurs présents dans le même saloon.",
          isOpen: false
        },
        {
          question: "Mes données personnelles sont-elles protégées ?",
          answer: "Oui. Les données sont utilisées uniquement dans le cadre du fonctionnement de l'application et de la sécurité des utilisateurs.",
          isOpen: false
        },
        {
          question: "Puis-je supprimer mon compte ?",
          answer: "Oui. Tu peux supprimer ton compte à tout moment depuis les paramètres.",
          isOpen: false
        },
        {
          question: "Que deviennent mes messages de chat ?",
          answer: "Les messages de chat sont éphémères et liés à ta présence dans un saloon. Ils ne sont pas conservés indéfiniment.",
          isOpen: false
        }
      ]
    },
    {
      title: 'Premium',
      icon: '⭐',
      isOpen: false,
      questions: [
        {
          question: "Saloons est-elle gratuite ?",
          answer: "Oui. Les fonctionnalités principales sont accessibles gratuitement.",
          isOpen: false
        },
        {
          question: "À quoi sert le mode premium ?",
          answer: "Le mode premium permet notamment de prolonger le temps dans un saloon, de rejoindre plusieurs saloons, de créer des saloons éphémères, et d'accéder à des fonctionnalités avancées.",
          isOpen: false
        },
        {
          question: "Le premium est-il obligatoire pour faire des rencontres ?",
          answer: "Non. Le premium améliore l'expérience, mais n'est pas nécessaire pour rencontrer des gens.",
          isOpen: false
        }
      ]
    }
  ]);

  footerMessage = "Saloons est un espace de rencontre basé sur le respect, le consentement et la bienveillance.";

  toggleSection(sectionIndex: number): void {
    this.faqSections.update(sections => {
      const updated = [...sections];
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        isOpen: !updated[sectionIndex].isOpen
      };
      return updated;
    });
  }

  toggleQuestion(sectionIndex: number, questionIndex: number): void {
    this.faqSections.update(sections => {
      const updated = [...sections];
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        questions: updated[sectionIndex].questions.map((q, i) => ({
          ...q,
          isOpen: i === questionIndex ? !q.isOpen : q.isOpen
        }))
      };
      return updated;
    });
  }
}
