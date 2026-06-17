import { useState, useEffect } from 'react'; 
import './App.scss';
import Titlebar from './components/Titlebar/Titlebar';
import Calendar from './components/Calendar/Calendar';
import { fetchTeaserData } from './services/api';
import { dataLayerPushView, dataLayerPushSeeAllClick, dataLayerPushLinkGlobalClick } from './services/analytics'; // Import des fonctions analytiques
import { db } from './services/firebase';
import { doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';

// Déclaration du composant principal App
function App() {
// Déclaration des états locaux :
    // - `calendar` : Contient les données du calendrier récupérées depuis Firestore.
    // - `showAll` : Indique si tous les éléments du calendrier doivent être affichés.
    // - `loading` : Indique si les données sont en cours de chargement.
    const [docId, setDocId] = useState(null);
    const [teaser, setTeaser] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fonction utilitaire pour convertir les retours à la ligne (\n) en éléments <br>
    const nl2br = (text) => {
        if (!text) return null;
        // Remplace la chaîne littérale \n par de vrais sauts de ligne
        const lines = text.split('\\n');
        return lines.map((line, index, array) => (
            <span key={index}>
                {line}
                {index < array.length - 1 && <br />}
            </span>
        ));
    };

    // Fonction exécutée lorsque la page est chargée
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const teaserDoc = urlParams.get('teaserDoc'); // Récupère la valeur du paramètre `teaserDoc`.

        if (!teaserDoc) {
            console.log('Aucun teaser trouvé.');
            return;
        }

        dataLayerPushView(teaserDoc); // Appeler la fonction déplacée
        setDocId(teaserDoc); // Met à jour l'état `docId` avec la valeur de teaserDoc

        async function loadTeaser() {
            try {
                const data = await fetchTeaserData(teaserDoc); // Appel à l'API pour récupérer les données.
                
                // Vérifier que les données ont été récupérées correctement
                if (data && data.teaserTitle) {
                    setTeaser(data); // Mise à jour de l'état `teaser` avec les données récupérées.
                    
                    // Incrémenter le compteur de vues après le chargement des données
                    await incrementViewCounter(teaserDoc);
                    
                    // Le chargement est terminé SEULEMENT si les données sont valides
                    setLoading(false);
                } else {
                    console.error('Données du teaser manquantes ou incorrectes');
                    // Le loading reste à true si les données ne sont pas valides
                }
            } catch (error) {
                console.error('Erreur lors du chargement du teaser:', error);
                // Le loading reste à true en cas d'erreur
            }
        }

        loadTeaser();
    }, []); // Le tableau de dépendances vide signifie que cet effet est exécuté une seule fois.


    async function incrementClickCounter(docId) {
        // try {
        //     console.log('Link Global clicked');
        //     const calendarRef = doc(db, 'embeds', docId); // Remplacez 'questions' par le nom de votre collection
        //     await updateDoc(calendarRef, {
        //         counterLinkGlobalClicks: increment(1), // Incrémente la valeur de 1
        //     });
        //     dataLayerPushLinkGlobalClick(docId); // Appel de la fonction pour envoyer l'événement au dataLayer
        // } catch (error) {
        //     console.error('Erreur lors de l\'incrémentation du compteur :', error);
        // }

        if (!docId) return;

        try {
            const docRef = doc(db, 'embeds', docId);
            await updateDoc(docRef, {
                counterClicks: increment(1)
            });
        } catch (error) {
            console.error('Erreur lors de l\'incrémentation de counterClicks :', error);
        }
    }

    async function incrementViewCounter(docId) {
        // try {
        //     const teaserRef = doc(db, 'embeds', docId);
        //     await updateDoc(teaserRef, {
        //         counterViews: increment(1), // Incrémente la valeur de 1
        //     });
        //     //console.log('Compteur de vues incrémenté dans Firestore');
        // } catch (error) {
        //     console.error('Erreur lors de l\'incrémentation du compteur de vues :', error);
        // }
    }

    const handleLinkGlobalClick = (e) => {
        e.preventDefault();
        
        // On déclenche l'incrémentation en BDD
        incrementClickCounter(docId);
        
        // On ouvre le lien après un léger délai pour garantir que la requête ait le temps de partir
        setTimeout(() => {
            const href = teaser?.linkGlobalHref || '#';
            if (href !== '#') {
                const link = document.createElement('a');
                link.href = href;
                link.target = '_parent';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }, 150);
    };

    return (
       
        <a href={teaser?.linkGlobalHref || '#'} id="link-global" className="block" target="_blank" onClick={handleLinkGlobalClick}>
            <div className="App overflow-hidden relative p-3 md:p-5">
                

                <div className="content absolute top-0 right-0 bottom-0 left-0  -z-10" style={teaser?.img ? {backgroundImage: `url(${teaser.img})`} : {}}></div>
                <div className="absolute top-0 right-1/2 bottom-0 left-0 bg-cover bg-center -z-10 bg-gradient-to-r from-black to-transparent opacity-70"></div> 

                <div className="gradient bg-amber-100"></div>
                <div className='absolute bottom-3 md:bottom-5'>
                     <span id="label" className="block w-full underline text-sm mb-3">{teaser?.teaserLabel || ''}</span>
                    <span id="title" className="font-blickb block mb-3 md:mb-5">{nl2br(teaser?.teaserTitle || '')}</span>
                    <button id="btn-read" className="block text-white rounded-full">{teaser?.linkGlobalTxt || ''}</button>
                </div>
               

                {loading && <LoadingOverlay />}
            </div>
            
        </a>
        
   
    );
}

export default App;
