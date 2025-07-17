import { useState, useEffect } from 'react'; 
import './App.scss';
import Titlebar from './components/Titlebar/Titlebar';
import Calendar from './components/Calendar/Calendar';
import { fetchTeaserData } from './services/api';
import { dataLayerPushView, dataLayerPushSeeAllClick, dataLayerPushLinkGlobalClick } from './services/analytics'; // Import des fonctions analytiques
import { db } from './services/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import bgImage from './assets/img/bg.png';

// Déclaration du composant principal App
function App() {
// Déclaration des états locaux :
    // - `calendar` : Contient les données du calendrier récupérées depuis Firestore.
    // - `showAll` : Indique si tous les éléments du calendrier doivent être affichés.
    const [docId, setDocId] = useState(null);
    const [teaser, setTeaser] = useState(null);
    const [showAll, setShowAll] = useState(false);

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
            const data = await fetchTeaserData(teaserDoc); // Appel à l'API pour récupérer les données.
            setTeaser(data); // Mise à jour de l'état `calendar` avec les données récupérées.
            
            // Incrémenter le compteur de vues après le chargement des données
            await incrementViewCounter(teaserDoc);
        }

        loadTeaser();
    }, []); // Le tableau de dépendances vide signifie que cet effet est exécuté une seule fois.


    async function incrementClickCounter(docId) {
        try {
            const calendarRef = doc(db, 'embeds', docId); // Remplacez 'questions' par le nom de votre collection
            await updateDoc(calendarRef, {
                counterLinkGlobalClicks: increment(1), // Incrémente la valeur de 1
            });
            //console.log('Compteur de clics incrémenté dans Firestore');
            dataLayerPushLinkGlobalClick(docId); // Appel de la fonction pour envoyer l'événement au dataLayer
        } catch (error) {
            console.error('Erreur lors de l\'incrémentation du compteur :', error);
        }
    }

    async function incrementViewCounter(docId) {
        try {
            const teaserRef = doc(db, 'embeds', docId);
            await updateDoc(teaserRef, {
                counterViews: increment(1), // Incrémente la valeur de 1
            });
            //console.log('Compteur de vues incrémenté dans Firestore');
        } catch (error) {
            console.error('Erreur lors de l\'incrémentation du compteur de vues :', error);
        }
    }

    const handleLinkGlobalClick = () => {
        incrementClickCounter(docId);
    };

    return (
       

        <a href="https://storytelling.blick.ch/fr/2025/groenland-cette-ile-que-trump-veut-prendre-par-la-force/" id="link-global" className="block" target="_blank" onClick={handleLinkGlobalClick}>
            <div className="App overflow-auto relative p-5">
                

                <div className="absolute top-0 right-0 bottom-0 left-0 bg-cover bg-right -z-10 rounded-lg" style={{backgroundImage: `url(${bgImage})`}}></div>
                <div className="absolute top-0 right-1/4 bottom-0 left-0 bg-cover bg-center -z-10 rounded-lg bg-gradient-to-r from-black to-transparent opacity-60"></div> 

                <span id="label" className="font-i block w-full underline text-sm mb-3">À ne pas manquer</span>
                <span id="title" className="font-blickb block mb-5">{teaser?.teaserTitle || ''}</span>
                <button id="btn-read" className="font-i block text-white rounded-full px-6 py-2">{teaser?.linkGlobalTxt || ''}</button>

                
            </div>
        </a>
   
    );
}

export default App;
