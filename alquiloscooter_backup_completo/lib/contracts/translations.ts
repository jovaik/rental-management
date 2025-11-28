
// Traducciones para contratos en múltiples idiomas

export type ContractLanguage = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';

export interface ContractTranslations {
  // Encabezado
  rentalContract: string;
  vehicleRental: string;
  
  // Secciones
  customerData: string;
  bookingData: string;
  additionalDrivers: string;
  priceBreakdown: string;
  vehiclesInfo: string;
  specialComments: string;
  generalConditions: string;
  articles: string;
  signature: string;
  deliveryInspection: string;
  returnInspection: string;
  inspectionComparison: string;
  contractAddenda: string;
  modificationHistory: string;
  version: string;
  modificationDate: string;
  modificationReason: string;
  modifiedBy: string;
  originalSignature: string;
  
  // Campos de cliente
  name: string;
  dniNie: string;
  phone: string;
  email: string;
  address: string;
  license: string;
  
  // Campos de reserva
  pickup: string;
  return: string;
  location: string;
  
  // Tabla de precios
  description: string;
  unitPrice: string;
  quantity: string;
  total: string;
  subtotal: string;
  iva: string;
  
  // Vehículos
  vehicle: string;
  registration: string;
  days: string;
  
  // Condiciones
  conditions: {
    rental: string;
    helmet: string;
    passengers: string;
    theft: string;
    returnDelay: string;
    maritimeZone: string;
  };
  
  // Advertencias
  warnings: {
    title: string;
    noObjects: string;
    mandatoryContract: string;
    helmetDamage: string;
    fuelReturn: string;
    cityLimits: string;
    sanctions: string;
  };
  
  // Artículos
  article1: {
    title: string;
    content: string[];
  };
  
  // Firma
  signatureDeclarations: {
    read: string;
    agree: string;
    truthful: string;
    license: string;
    responsibility: string;
    charges: string;
  };
  
  signatureInfo: {
    date: string;
    time: string;
    ip: string;
    signature: string;
    verifiedSignature: string;
  };
  
  footer: string;
  
  // Inspección de salida
  inspectionTitle: string;
  inspectionDate: string;
  inspectionOdometer: string;
  inspectionFuel: string;
  inspectionCondition: string;
  inspectionPhotos: string;
  inspectionNotes: string;
  
  // Campos adicionales de inspección
  front: string;
  leftSide: string;
  rear: string;
  rightSide: string;
  odometer: string;
  bookingNumber: string;
  contractNumber: string;
  vehicleInformation: string;
  customer: string;
  inspectionData: string;
  fuelLevel: string;
  inspector: string;
  generalCondition: string;
  notes: string;
  photos: string;
  
  // Campos adicionales del contrato
  contractTitle: string;
  contractDate: string;
  fullName: string;
  dni: string;
  rentalDetails: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  vehicles: string;
  pricePerDay: string;
  model: string;
  rentalPeriod: string;
  termsAndConditions: string;
  terms: string[];
  signatureTitle: string;
}

export const translations: Record<ContractLanguage, ContractTranslations> = {
  es: {
    rentalContract: 'Contrato de Alquiler',
    vehicleRental: 'Alquiler de Vehículos',
    
    customerData: '📋 Datos del Cliente',
    bookingData: '📅 Datos de la Reserva',
    additionalDrivers: '👥 Conductores Autorizados',
    priceBreakdown: '💰 Desglose de Precios',
    vehiclesInfo: '🚗 Información de los Vehículos',
    specialComments: '📝 Comentarios / Instrucciones Especiales',
    generalConditions: '📑 Condiciones Generales',
    articles: '📜 Artículos del Contrato',
    signature: '✍️ Firma del Contrato',
    deliveryInspection: '📸 Inspección de Salida',
    returnInspection: '📸 Inspección de Devolución',
    inspectionComparison: '🔍 Comparativa Visual de Inspecciones',
    contractAddenda: '📌 Anexo al Contrato',
    modificationHistory: 'Historial de Modificaciones',
    version: 'Versión',
    modificationDate: 'Fecha de modificación',
    modificationReason: 'Motivo',
    modifiedBy: 'Modificado por',
    originalSignature: 'Firma Original',
    
    name: 'Nombre',
    dniNie: 'DNI/NIE',
    phone: 'Teléfono',
    email: 'Email',
    address: 'Dirección',
    license: 'Carnet',
    
    pickup: 'Recogida',
    return: 'Devolución',
    location: 'Lugar',
    
    description: 'Descripción',
    unitPrice: 'Precio Unit.',
    quantity: 'Cantidad',
    total: 'Total',
    subtotal: 'Subtotal (Base Imponible)',
    iva: 'IVA (21%)',
    
    vehicle: 'Vehículo',
    registration: 'Matrícula',
    days: 'Días',
    
    conditions: {
      rental: '<strong>Alquiler:</strong> Cubre el periodo contratado.',
      helmet: '<strong>Casco:</strong> El uso del mismo es obligatorio.',
      passengers: '<strong>Pasajeros:</strong> Máximo 2 personas incluido el conductor, siempre con cascos.',
      theft: '<strong>Robo:</strong> En caso de sustracción, perderá la cantidad abonada.',
      returnDelay: '<strong>Devolución:</strong> Recargo adicional de un día si no se devuelve a tiempo.',
      maritimeZone: '<strong>Zona marítima:</strong> Conducir en zonas marítimas anula el contrato y el seguro.'
    },
    
    warnings: {
      title: '⚠️ Importante',
      noObjects: 'NO DEJE OBJETOS EN EL INTERIOR Y CIERRE LA MOTO',
      mandatoryContract: 'ES OBLIGATORIO LLEVAR ESTE CONTRATO EN LA MOTO O EN SU MÓVIL',
      helmetDamage: 'LA PÉRDIDA O DAÑO DE LOS CASCOS: 50€ POR UNIDAD',
      fuelReturn: 'DEVOLUCIÓN CON MENOS GASOLINA: 10€ + IMPORTE DE LA GASOLINA',
      cityLimits: 'NO SALIR DE LOS LÍMITES DE LA CIUDAD (50cc) O PROVINCIA (resto)',
      sanctions: 'SANCIONES: Importe + 30€ de gastos de gestión'
    },
    
    article1: {
      title: 'ARTÍCULO 1º. UTILIZACIÓN DEL VEHÍCULO',
      content: [
        'El CLIENTE se obliga a no dejar conducir el vehículo a otras personas, salvo las expresamente aceptadas por ALQUILOSCOOTER.',
        'El CLIENTE se obliga a no conducir ni permitir que se conduzca el vehículo:'
      ]
    },
    
    signatureDeclarations: {
      read: 'Haber leído y comprendido todas las cláusulas del contrato',
      agree: 'Estar conforme con todas las condiciones establecidas',
      truthful: 'Que todos los datos proporcionados son veraces y exactos',
      license: 'Estar en posesión de la licencia necesaria para conducir este vehículo',
      responsibility: 'Aceptar responsabilidad ante pérdida, robo, daño o perjuicio al vehículo',
      charges: 'Autorizar cargos adicionales en tarjeta por gastos ocasionados'
    },
    
    signatureInfo: {
      date: 'Fecha de firma',
      time: 'Hora de firma',
      ip: 'IP del firmante',
      signature: 'FIRMA DIGITAL DEL CLIENTE',
      verifiedSignature: 'Firma digital verificada y capturada en el momento de la firma del contrato'
    },
    
    footer: 'Este contrato ha sido generado electrónicamente y es válido sin firma manuscrita.<br>Para cualquier consulta, contacte con nosotros.',
    
    inspectionTitle: 'Inspección de Salida del Vehículo',
    inspectionDate: 'Fecha',
    inspectionOdometer: 'Kilometraje',
    inspectionFuel: 'Combustible',
    inspectionCondition: 'Estado General',
    inspectionPhotos: 'Fotografías del Vehículo',
    inspectionNotes: 'Observaciones',
    
    // Campos adicionales de inspección
    front: 'Frontal',
    leftSide: 'Lateral Izquierdo',
    rear: 'Trasera',
    rightSide: 'Lateral Derecho',
    odometer: 'Cuentakilómetros',
    bookingNumber: 'Nº Reserva',
    contractNumber: 'Nº Contrato',
    vehicleInformation: 'Información del Vehículo',
    customer: 'Cliente',
    inspectionData: 'Datos de Inspección',
    fuelLevel: 'Nivel de Combustible',
    inspector: 'Inspector',
    generalCondition: 'Estado General',
    notes: 'Notas',
    photos: 'Fotos',
    
    // Campos adicionales del contrato
    contractTitle: 'Contrato de Alquiler de Vehículos',
    contractDate: 'Fecha de Contrato',
    fullName: 'Nombre Completo',
    dni: 'DNI/NIE',
    rentalDetails: 'Detalles del Alquiler',
    pickupDate: 'Fecha de Recogida',
    returnDate: 'Fecha de Devolución',
    pickupLocation: 'Lugar de Recogida',
    returnLocation: 'Lugar de Devolución',
    vehicles: 'Vehículos',
    pricePerDay: 'Precio por Día',
    model: 'Modelo',
    rentalPeriod: 'Periodo de Alquiler',
    termsAndConditions: 'Términos y Condiciones',
    terms: [
      'El arrendatario se compromete a utilizar el vehículo de manera responsable',
      'El vehículo debe ser devuelto en las mismas condiciones',
      'El arrendatario es responsable de cualquier daño durante el periodo de alquiler'
    ],
    signatureTitle: 'Firma del Cliente'
  },
  
  en: {
    rentalContract: 'Rental Agreement',
    vehicleRental: 'Vehicle Rental',
    
    customerData: '📋 Customer Information',
    bookingData: '📅 Booking Details',
    additionalDrivers: '👥 Authorized Drivers',
    priceBreakdown: '💰 Price Breakdown',
    vehiclesInfo: '🚗 Vehicle Information',
    specialComments: '📝 Special Comments / Instructions',
    generalConditions: '📑 General Conditions',
    articles: '📜 Contract Articles',
    signature: '✍️ Contract Signature',
    deliveryInspection: '📸 Delivery Inspection',
    returnInspection: '📸 Return Inspection',
    inspectionComparison: '🔍 Visual Inspection Comparison',
    contractAddenda: '📌 Contract Annex',
    modificationHistory: 'Modification History',
    version: 'Version',
    modificationDate: 'Modification date',
    modificationReason: 'Reason',
    modifiedBy: 'Modified by',
    originalSignature: 'Original Signature',
    
    name: 'Name',
    dniNie: 'ID/Passport',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    license: 'License',
    
    pickup: 'Pickup',
    return: 'Return',
    location: 'Location',
    
    description: 'Description',
    unitPrice: 'Unit Price',
    quantity: 'Quantity',
    total: 'Total',
    subtotal: 'Subtotal (Tax Base)',
    iva: 'VAT (21%)',
    
    vehicle: 'Vehicle',
    registration: 'Registration',
    days: 'Days',
    
    conditions: {
      rental: '<strong>Rental:</strong> Covers the contracted period.',
      helmet: '<strong>Helmet:</strong> Wearing a helmet is mandatory.',
      passengers: '<strong>Passengers:</strong> Maximum 2 people including driver, always with helmets.',
      theft: '<strong>Theft:</strong> In case of theft, you will lose the paid amount.',
      returnDelay: '<strong>Return:</strong> Additional charge of one day if not returned on time.',
      maritimeZone: '<strong>Maritime zone:</strong> Driving in maritime areas voids contract and insurance.'
    },
    
    warnings: {
      title: '⚠️ Important',
      noObjects: 'DO NOT LEAVE OBJECTS INSIDE AND LOCK THE VEHICLE',
      mandatoryContract: 'IT IS MANDATORY TO CARRY THIS CONTRACT ON THE VEHICLE OR ON YOUR PHONE',
      helmetDamage: 'LOSS OR DAMAGE TO HELMETS: €50 PER UNIT',
      fuelReturn: 'RETURN WITH LESS FUEL: €10 + FUEL COST',
      cityLimits: 'DO NOT LEAVE CITY LIMITS (50cc) OR PROVINCE (others)',
      sanctions: 'SANCTIONS: Amount + €30 administrative fee'
    },
    
    article1: {
      title: 'ARTICLE 1. VEHICLE USE',
      content: [
        'The CUSTOMER agrees not to allow other persons to drive the vehicle, except those expressly authorized by the company.',
        'The CUSTOMER agrees not to drive or allow the vehicle to be driven:'
      ]
    },
    
    signatureDeclarations: {
      read: 'I have read and understood all the clauses of the contract',
      agree: 'I agree with all the established conditions',
      truthful: 'All information provided is truthful and accurate',
      license: 'I possess the necessary license to drive this vehicle',
      responsibility: 'I accept responsibility for loss, theft, damage or harm to the vehicle',
      charges: 'I authorize additional charges on the card for incurred expenses'
    },
    
    signatureInfo: {
      date: 'Signature date',
      time: 'Signature time',
      ip: 'Signer IP',
      signature: 'CUSTOMER DIGITAL SIGNATURE',
      verifiedSignature: 'Verified digital signature captured at the time of contract signing'
    },
    
    footer: 'This contract has been generated electronically and is valid without handwritten signature.<br>For any inquiries, please contact us.',
    
    inspectionTitle: 'Vehicle Delivery Inspection',
    inspectionDate: 'Date',
    inspectionOdometer: 'Odometer',
    inspectionFuel: 'Fuel',
    inspectionCondition: 'General Condition',
    inspectionPhotos: 'Vehicle Photographs',
    inspectionNotes: 'Observations',
    
    // Additional inspection fields
    front: 'Front',
    leftSide: 'Left Side',
    rear: 'Rear',
    rightSide: 'Right Side',
    odometer: 'Odometer',
    bookingNumber: 'Booking No.',
    contractNumber: 'Contract No.',
    vehicleInformation: 'Vehicle Information',
    customer: 'Customer',
    inspectionData: 'Inspection Data',
    fuelLevel: 'Fuel Level',
    inspector: 'Inspector',
    generalCondition: 'General Condition',
    notes: 'Notes',
    photos: 'Photos',
    
    // Additional contract fields
    contractTitle: 'Vehicle Rental Contract',
    contractDate: 'Contract Date',
    fullName: 'Full Name',
    dni: 'ID/Passport',
    rentalDetails: 'Rental Details',
    pickupDate: 'Pickup Date',
    returnDate: 'Return Date',
    pickupLocation: 'Pickup Location',
    returnLocation: 'Return Location',
    vehicles: 'Vehicles',
    pricePerDay: 'Price per Day',
    model: 'Model',
    rentalPeriod: 'Rental Period',
    termsAndConditions: 'Terms and Conditions',
    terms: [
      'The lessee agrees to use the vehicle responsibly',
      'The vehicle must be returned in the same condition',
      'The lessee is responsible for any damage during the rental period'
    ],
    signatureTitle: 'Customer Signature'
  },
  
  fr: {
    rentalContract: 'Contrat de Location',
    vehicleRental: 'Location de Véhicules',
    
    customerData: '📋 Données du Client',
    bookingData: '📅 Détails de la Réservation',
    additionalDrivers: '👥 Conducteurs Autorisés',
    priceBreakdown: '💰 Détail des Prix',
    vehiclesInfo: '🚗 Information des Véhicules',
    specialComments: '📝 Commentaires / Instructions Spéciales',
    generalConditions: '📑 Conditions Générales',
    articles: '📜 Articles du Contrat',
    signature: '✍️ Signature du Contrat',
    deliveryInspection: '📸 Inspection de Sortie',
    returnInspection: '📸 Inspection de Retour',
    inspectionComparison: '🔍 Comparaison Visuelle des Inspections',
    contractAddenda: '📌 Annexe au Contrat',
    modificationHistory: 'Historique des Modifications',
    version: 'Version',
    modificationDate: 'Date de modification',
    modificationReason: 'Motif',
    modifiedBy: 'Modifié par',
    originalSignature: 'Signature Originale',
    
    name: 'Nom',
    dniNie: 'Pièce d\'identité',
    phone: 'Téléphone',
    email: 'Email',
    address: 'Adresse',
    license: 'Permis',
    
    pickup: 'Prise en charge',
    return: 'Retour',
    location: 'Lieu',
    
    description: 'Description',
    unitPrice: 'Prix Unitaire',
    quantity: 'Quantité',
    total: 'Total',
    subtotal: 'Sous-total (Base imposable)',
    iva: 'TVA (21%)',
    
    vehicle: 'Véhicule',
    registration: 'Immatriculation',
    days: 'Jours',
    
    conditions: {
      rental: '<strong>Location:</strong> Couvre la période contractée.',
      helmet: '<strong>Casque:</strong> Le port du casque est obligatoire.',
      passengers: '<strong>Passagers:</strong> Maximum 2 personnes incluant le conducteur, toujours avec casques.',
      theft: '<strong>Vol:</strong> En cas de vol, vous perdrez le montant payé.',
      returnDelay: '<strong>Retour:</strong> Frais supplémentaire d\'un jour si non retourné à temps.',
      maritimeZone: '<strong>Zone maritime:</strong> Conduire en zones maritimes annule le contrat et l\'assurance.'
    },
    
    warnings: {
      title: '⚠️ Important',
      noObjects: 'NE LAISSEZ PAS D\'OBJETS À L\'INTÉRIEUR ET FERMEZ LE VÉHICULE',
      mandatoryContract: 'IL EST OBLIGATOIRE D\'AVOIR CE CONTRAT SUR LE VÉHICULE OU SUR VOTRE TÉLÉPHONE',
      helmetDamage: 'PERTE OU DOMMAGE DES CASQUES: 50€ PAR UNITÉ',
      fuelReturn: 'RETOUR AVEC MOINS DE CARBURANT: 10€ + COÛT DU CARBURANT',
      cityLimits: 'NE PAS SORTIR DES LIMITES DE LA VILLE (50cc) OU PROVINCE (autres)',
      sanctions: 'SANCTIONS: Montant + 30€ de frais de gestion'
    },
    
    article1: {
      title: 'ARTICLE 1. UTILISATION DU VÉHICULE',
      content: [
        'Le CLIENT s\'engage à ne pas laisser d\'autres personnes conduire le véhicule, sauf celles expressément autorisées par l\'entreprise.',
        'Le CLIENT s\'engage à ne pas conduire ou permettre que le véhicule soit conduit:'
      ]
    },
    
    signatureDeclarations: {
      read: 'J\'ai lu et compris toutes les clauses du contrat',
      agree: 'Je suis d\'accord avec toutes les conditions établies',
      truthful: 'Toutes les informations fournies sont véridiques et exactes',
      license: 'Je possède le permis nécessaire pour conduire ce véhicule',
      responsibility: 'J\'accepte la responsabilité en cas de perte, vol, dommage ou préjudice au véhicule',
      charges: 'J\'autorise les charges supplémentaires sur la carte pour les frais engagés'
    },
    
    signatureInfo: {
      date: 'Date de signature',
      time: 'Heure de signature',
      ip: 'IP du signataire',
      signature: 'SIGNATURE NUMÉRIQUE DU CLIENT',
      verifiedSignature: 'Signature numérique vérifiée et capturée au moment de la signature du contrat'
    },
    
    footer: 'Ce contrat a été généré électroniquement et est valide sans signature manuscrite.<br>Pour toute question, contactez-nous.',
    
    inspectionTitle: 'Inspection de Sortie du Véhicule',
    inspectionDate: 'Date',
    inspectionOdometer: 'Kilométrage',
    inspectionFuel: 'Carburant',
    inspectionCondition: 'État Général',
    inspectionPhotos: 'Photographies du Véhicule',
    inspectionNotes: 'Observations',
    
    // Champs supplémentaires d'inspection
    front: 'Avant',
    leftSide: 'Côté Gauche',
    rear: 'Arrière',
    rightSide: 'Côté Droit',
    odometer: 'Compteur',
    bookingNumber: 'Nº Réservation',
    contractNumber: 'Nº Contrat',
    vehicleInformation: 'Information du Véhicule',
    customer: 'Client',
    inspectionData: 'Données d\'Inspection',
    fuelLevel: 'Niveau de Carburant',
    inspector: 'Inspecteur',
    generalCondition: 'État Général',
    notes: 'Notes',
    photos: 'Photos',
    
    // Champs supplémentaires du contrat
    contractTitle: 'Contrat de Location de Véhicules',
    contractDate: 'Date du Contrat',
    fullName: 'Nom Complet',
    dni: 'ID/Passeport',
    rentalDetails: 'Détails de Location',
    pickupDate: 'Date de Prise en Charge',
    returnDate: 'Date de Retour',
    pickupLocation: 'Lieu de Prise en Charge',
    returnLocation: 'Lieu de Retour',
    vehicles: 'Véhicules',
    pricePerDay: 'Prix par Jour',
    model: 'Modèle',
    rentalPeriod: 'Période de Location',
    termsAndConditions: 'Termes et Conditions',
    terms: [
      'Le locataire s\'engage à utiliser le véhicule de manière responsable',
      'Le véhicule doit être retourné dans le même état',
      'Le locataire est responsable de tout dommage pendant la période de location'
    ],
    signatureTitle: 'Signature du Client'
  },
  
  de: {
    rentalContract: 'Mietvertrag',
    vehicleRental: 'Fahrzeugvermietung',
    
    customerData: '📋 Kundendaten',
    bookingData: '📅 Buchungsdetails',
    additionalDrivers: '👥 Autorisierte Fahrer',
    priceBreakdown: '💰 Preisaufschlüsselung',
    vehiclesInfo: '🚗 Fahrzeuginformationen',
    specialComments: '📝 Besondere Kommentare / Anweisungen',
    generalConditions: '📑 Allgemeine Bedingungen',
    articles: '📜 Vertragsartikel',
    signature: '✍️ Vertragsunterzeichnung',
    deliveryInspection: '📸 Auslieferungsinspektion',
    returnInspection: '📸 Rückgabeinspektion',
    inspectionComparison: '🔍 Visueller Inspektionsvergleich',
    contractAddenda: '📌 Vertragsanhang',
    modificationHistory: 'Änderungsverlauf',
    version: 'Version',
    modificationDate: 'Änderungsdatum',
    modificationReason: 'Grund',
    modifiedBy: 'Geändert von',
    originalSignature: 'Original-Unterschrift',
    
    name: 'Name',
    dniNie: 'Ausweis/Pass',
    phone: 'Telefon',
    email: 'Email',
    address: 'Adresse',
    license: 'Führerschein',
    
    pickup: 'Abholung',
    return: 'Rückgabe',
    location: 'Ort',
    
    description: 'Beschreibung',
    unitPrice: 'Stückpreis',
    quantity: 'Menge',
    total: 'Gesamt',
    subtotal: 'Zwischensumme (Steuerbasis)',
    iva: 'MwSt (21%)',
    
    vehicle: 'Fahrzeug',
    registration: 'Kennzeichen',
    days: 'Tage',
    
    conditions: {
      rental: '<strong>Miete:</strong> Deckt den vertraglich vereinbarten Zeitraum.',
      helmet: '<strong>Helm:</strong> Das Tragen eines Helms ist obligatorisch.',
      passengers: '<strong>Passagiere:</strong> Maximal 2 Personen inkl. Fahrer, immer mit Helmen.',
      theft: '<strong>Diebstahl:</strong> Im Falle eines Diebstahls verlieren Sie den gezahlten Betrag.',
      returnDelay: '<strong>Rückgabe:</strong> Zusätzliche Gebühr von einem Tag bei verspäteter Rückgabe.',
      maritimeZone: '<strong>Meereszone:</strong> Fahren in Meeresbereichen macht den Vertrag und die Versicherung ungültig.'
    },
    
    warnings: {
      title: '⚠️ Wichtig',
      noObjects: 'LASSEN SIE KEINE GEGENSTÄNDE IM INNEREN UND VERSCHLIESSEN SIE DAS FAHRZEUG',
      mandatoryContract: 'ES IST OBLIGATORISCH, DIESEN VERTRAG AM FAHRZEUG ODER AUF IHREM TELEFON ZU HABEN',
      helmetDamage: 'VERLUST ODER BESCHÄDIGUNG DER HELME: 50€ PRO EINHEIT',
      fuelReturn: 'RÜCKGABE MIT WENIGER KRAFTSTOFF: 10€ + KRAFTSTOFFKOSTEN',
      cityLimits: 'NICHT AUSSERHALB DER STADTGRENZEN (50cc) ODER PROVINZ (andere) FAHREN',
      sanctions: 'SANKTIONEN: Betrag + 30€ Verwaltungsgebühr'
    },
    
    article1: {
      title: 'ARTIKEL 1. FAHRZEUGNUTZUNG',
      content: [
        'Der KUNDE verpflichtet sich, anderen Personen das Fahren des Fahrzeugs nicht zu gestatten, außer denen, die ausdrücklich vom Unternehmen autorisiert sind.',
        'Der KUNDE verpflichtet sich, das Fahrzeug nicht zu fahren oder fahren zu lassen:'
      ]
    },
    
    signatureDeclarations: {
      read: 'Ich habe alle Klauseln des Vertrags gelesen und verstanden',
      agree: 'Ich stimme allen festgelegten Bedingungen zu',
      truthful: 'Alle bereitgestellten Informationen sind wahrheitsgemäß und genau',
      license: 'Ich besitze die erforderliche Lizenz, um dieses Fahrzeug zu fahren',
      responsibility: 'Ich akzeptiere die Verantwortung für Verlust, Diebstahl, Schaden oder Schaden am Fahrzeug',
      charges: 'Ich autorisiere zusätzliche Belastungen auf der Karte für angefallene Kosten'
    },
    
    signatureInfo: {
      date: 'Unterschriftsdatum',
      time: 'Unterschriftszeit',
      ip: 'Unterzeichner-IP',
      signature: 'DIGITALE UNTERSCHRIFT DES KUNDEN',
      verifiedSignature: 'Verifizierte digitale Unterschrift zum Zeitpunkt der Vertragsunterzeichnung erfasst'
    },
    
    footer: 'Dieser Vertrag wurde elektronisch generiert und ist ohne handschriftliche Unterschrift gültig.<br>Bei Fragen kontaktieren Sie uns bitte.',
    
    inspectionTitle: 'Fahrzeugauslieferungsinspektion',
    inspectionDate: 'Datum',
    inspectionOdometer: 'Kilometerstand',
    inspectionFuel: 'Kraftstoff',
    inspectionCondition: 'Allgemeiner Zustand',
    inspectionPhotos: 'Fahrzeugfotos',
    inspectionNotes: 'Beobachtungen',
    
    // Zusätzliche Inspektionsfelder
    front: 'Vorne',
    leftSide: 'Linke Seite',
    rear: 'Hinten',
    rightSide: 'Rechte Seite',
    odometer: 'Kilometerzähler',
    bookingNumber: 'Buchungsnr.',
    contractNumber: 'Vertragsnr.',
    vehicleInformation: 'Fahrzeuginformationen',
    customer: 'Kunde',
    inspectionData: 'Inspektionsdaten',
    fuelLevel: 'Kraftstoffstand',
    inspector: 'Inspektor',
    generalCondition: 'Allgemeiner Zustand',
    notes: 'Notizen',
    photos: 'Fotos',
    
    // Zusätzliche Vertragsfelder
    contractTitle: 'Fahrzeugmietvertrag',
    contractDate: 'Vertragsdatum',
    fullName: 'Vollständiger Name',
    dni: 'Ausweis/Pass',
    rentalDetails: 'Mietdetails',
    pickupDate: 'Abholdatum',
    returnDate: 'Rückgabedatum',
    pickupLocation: 'Abholort',
    returnLocation: 'Rückgabeort',
    vehicles: 'Fahrzeuge',
    pricePerDay: 'Preis pro Tag',
    model: 'Modell',
    rentalPeriod: 'Mietdauer',
    termsAndConditions: 'Geschäftsbedingungen',
    terms: [
      'Der Mieter verpflichtet sich, das Fahrzeug verantwortungsvoll zu nutzen',
      'Das Fahrzeug muss im gleichen Zustand zurückgegeben werden',
      'Der Mieter ist für Schäden während der Mietzeit verantwortlich'
    ],
    signatureTitle: 'Unterschrift des Kunden'
  },
  
  it: {
    rentalContract: 'Contratto di Noleggio',
    vehicleRental: 'Noleggio Veicoli',
    
    customerData: '📋 Dati del Cliente',
    bookingData: '📅 Dettagli della Prenotazione',
    additionalDrivers: '👥 Conducenti Autorizzati',
    priceBreakdown: '💰 Dettaglio Prezzi',
    vehiclesInfo: '🚗 Informazioni sui Veicoli',
    specialComments: '📝 Commenti / Istruzioni Speciali',
    generalConditions: '📑 Condizioni Generali',
    articles: '📜 Articoli del Contratto',
    signature: '✍️ Firma del Contratto',
    deliveryInspection: '📸 Ispezione di Consegna',
    returnInspection: '📸 Ispezione di Restituzione',
    inspectionComparison: '🔍 Confronto Visivo delle Ispezioni',
    contractAddenda: '📌 Allegato al Contratto',
    modificationHistory: 'Cronologia Modifiche',
    version: 'Versione',
    modificationDate: 'Data modifica',
    modificationReason: 'Motivo',
    modifiedBy: 'Modificato da',
    originalSignature: 'Firma Originale',
    
    name: 'Nome',
    dniNie: 'Documento d\'identità',
    phone: 'Telefono',
    email: 'Email',
    address: 'Indirizzo',
    license: 'Patente',
    
    pickup: 'Ritiro',
    return: 'Restituzione',
    location: 'Luogo',
    
    description: 'Descrizione',
    unitPrice: 'Prezzo Unitario',
    quantity: 'Quantità',
    total: 'Totale',
    subtotal: 'Subtotale (Base imponibile)',
    iva: 'IVA (21%)',
    
    vehicle: 'Veicolo',
    registration: 'Targa',
    days: 'Giorni',
    
    conditions: {
      rental: '<strong>Noleggio:</strong> Copre il periodo contrattato.',
      helmet: '<strong>Casco:</strong> L\'uso del casco è obbligatorio.',
      passengers: '<strong>Passeggeri:</strong> Massimo 2 persone incluso il conducente, sempre con caschi.',
      theft: '<strong>Furto:</strong> In caso di furto, perderete l\'importo pagato.',
      returnDelay: '<strong>Restituzione:</strong> Supplemento di un giorno se non restituito in tempo.',
      maritimeZone: '<strong>Zona marittima:</strong> Guidare in zone marittime annulla il contratto e l\'assicurazione.'
    },
    
    warnings: {
      title: '⚠️ Importante',
      noObjects: 'NON LASCIARE OGGETTI ALL\'INTERNO E CHIUDERE IL VEICOLO',
      mandatoryContract: 'È OBBLIGATORIO AVERE QUESTO CONTRATTO SUL VEICOLO O SUL TELEFONO',
      helmetDamage: 'PERDITA O DANNO DEI CASCHI: 50€ PER UNITÀ',
      fuelReturn: 'RESTITUZIONE CON MENO CARBURANTE: 10€ + COSTO DEL CARBURANTE',
      cityLimits: 'NON USCIRE DAI LIMITI DELLA CITTÀ (50cc) O PROVINCIA (altri)',
      sanctions: 'SANZIONI: Importo + 30€ di spese di gestione'
    },
    
    article1: {
      title: 'ARTICOLO 1. USO DEL VEICOLO',
      content: [
        'Il CLIENTE si impegna a non permettere ad altre persone di guidare il veicolo, tranne quelle espressamente autorizzate dall\'azienda.',
        'Il CLIENTE si impegna a non guidare o permettere che il veicolo sia guidato:'
      ]
    },
    
    signatureDeclarations: {
      read: 'Ho letto e compreso tutte le clausole del contratto',
      agree: 'Sono d\'accordo con tutte le condizioni stabilite',
      truthful: 'Tutte le informazioni fornite sono veritiere e accurate',
      license: 'Possiedo la licenza necessaria per guidare questo veicolo',
      responsibility: 'Accetto la responsabilità in caso di perdita, furto, danno o pregiudizio al veicolo',
      charges: 'Autorizzo addebiti aggiuntivi sulla carta per le spese sostenute'
    },
    
    signatureInfo: {
      date: 'Data della firma',
      time: 'Ora della firma',
      ip: 'IP del firmatario',
      signature: 'FIRMA DIGITALE DEL CLIENTE',
      verifiedSignature: 'Firma digitale verificata e acquisita al momento della firma del contratto'
    },
    
    footer: 'Questo contratto è stato generato elettronicamente ed è valido senza firma manoscritta.<br>Per qualsiasi domanda, contattateci.',
    
    inspectionTitle: 'Ispezione di Consegna del Veicolo',
    inspectionDate: 'Data',
    inspectionOdometer: 'Chilometraggio',
    inspectionFuel: 'Carburante',
    inspectionCondition: 'Condizione Generale',
    inspectionPhotos: 'Fotografie del Veicolo',
    inspectionNotes: 'Osservazioni',
    
    // Campi aggiuntivi di ispezione
    front: 'Anteriore',
    leftSide: 'Lato Sinistro',
    rear: 'Posteriore',
    rightSide: 'Lato Destro',
    odometer: 'Contachilometri',
    bookingNumber: 'N. Prenotazione',
    contractNumber: 'N. Contratto',
    vehicleInformation: 'Informazioni Veicolo',
    customer: 'Cliente',
    inspectionData: 'Dati Ispezione',
    fuelLevel: 'Livello Carburante',
    inspector: 'Ispettore',
    generalCondition: 'Condizione Generale',
    notes: 'Note',
    photos: 'Foto',
    
    // Campi aggiuntivi del contratto
    contractTitle: 'Contratto di Noleggio Veicoli',
    contractDate: 'Data Contratto',
    fullName: 'Nome Completo',
    dni: 'ID/Passaporto',
    rentalDetails: 'Dettagli Noleggio',
    pickupDate: 'Data di Ritiro',
    returnDate: 'Data di Restituzione',
    pickupLocation: 'Luogo di Ritiro',
    returnLocation: 'Luogo di Restituzione',
    vehicles: 'Veicoli',
    pricePerDay: 'Prezzo al Giorno',
    model: 'Modello',
    rentalPeriod: 'Periodo di Noleggio',
    termsAndConditions: 'Termini e Condizioni',
    terms: [
      'Il locatario si impegna a utilizzare il veicolo in modo responsabile',
      'Il veicolo deve essere restituito nelle stesse condizioni',
      'Il locatario è responsabile per eventuali danni durante il periodo di noleggio'
    ],
    signatureTitle: 'Firma del Cliente'
  },
  
  pt: {
    rentalContract: 'Contrato de Aluguel',
    vehicleRental: 'Aluguel de Veículos',
    
    customerData: '📋 Dados do Cliente',
    bookingData: '📅 Detalhes da Reserva',
    additionalDrivers: '👥 Condutores Autorizados',
    priceBreakdown: '💰 Detalhamento de Preços',
    vehiclesInfo: '🚗 Informação dos Veículos',
    specialComments: '📝 Comentários / Instruções Especiais',
    generalConditions: '📑 Condições Gerais',
    articles: '📜 Artigos do Contrato',
    signature: '✍️ Assinatura do Contrato',
    deliveryInspection: '📸 Inspeção de Entrega',
    returnInspection: '📸 Inspeção de Devolução',
    inspectionComparison: '🔍 Comparação Visual das Inspeções',
    contractAddenda: '📌 Anexo ao Contrato',
    modificationHistory: 'Histórico de Modificações',
    version: 'Versão',
    modificationDate: 'Data de modificação',
    modificationReason: 'Motivo',
    modifiedBy: 'Modificado por',
    originalSignature: 'Assinatura Original',
    
    name: 'Nome',
    dniNie: 'Documento de identidade',
    phone: 'Telefone',
    email: 'Email',
    address: 'Endereço',
    license: 'Carteira',
    
    pickup: 'Retirada',
    return: 'Devolução',
    location: 'Local',
    
    description: 'Descrição',
    unitPrice: 'Preço Unitário',
    quantity: 'Quantidade',
    total: 'Total',
    subtotal: 'Subtotal (Base tributável)',
    iva: 'IVA (21%)',
    
    vehicle: 'Veículo',
    registration: 'Matrícula',
    days: 'Dias',
    
    conditions: {
      rental: '<strong>Aluguel:</strong> Cobre o período contratado.',
      helmet: '<strong>Capacete:</strong> O uso do capacete é obrigatório.',
      passengers: '<strong>Passageiros:</strong> Máximo 2 pessoas incluindo o motorista, sempre com capacetes.',
      theft: '<strong>Roubo:</strong> Em caso de roubo, você perderá o valor pago.',
      returnDelay: '<strong>Devolução:</strong> Taxa adicional de um dia se não devolvido a tempo.',
      maritimeZone: '<strong>Zona marítima:</strong> Dirigir em zonas marítimas anula o contrato e o seguro.'
    },
    
    warnings: {
      title: '⚠️ Importante',
      noObjects: 'NÃO DEIXE OBJETOS NO INTERIOR E FECHE O VEÍCULO',
      mandatoryContract: 'É OBRIGATÓRIO TER ESTE CONTRATO NO VEÍCULO OU NO SEU TELEFONE',
      helmetDamage: 'PERDA OU DANO DOS CAPACETES: €50 POR UNIDADE',
      fuelReturn: 'DEVOLUÇÃO COM MENOS COMBUSTÍVEL: €10 + CUSTO DO COMBUSTÍVEL',
      cityLimits: 'NÃO SAIR DOS LIMITES DA CIDADE (50cc) OU PROVÍNCIA (outros)',
      sanctions: 'SANÇÕES: Valor + €30 de taxa administrativa'
    },
    
    article1: {
      title: 'ARTIGO 1. USO DO VEÍCULO',
      content: [
        'O CLIENTE se compromete a não permitir que outras pessoas dirijam o veículo, exceto aquelas expressamente autorizadas pela empresa.',
        'O CLIENTE se compromete a não dirigir ou permitir que o veículo seja dirigido:'
      ]
    },
    
    signatureDeclarations: {
      read: 'Li e compreendi todas as cláusulas do contrato',
      agree: 'Concordo com todas as condições estabelecidas',
      truthful: 'Todas as informações fornecidas são verdadeiras e precisas',
      license: 'Possuo a licença necessária para dirigir este veículo',
      responsibility: 'Aceito a responsabilidade por perda, roubo, dano ou prejuízo ao veículo',
      charges: 'Autorizo cobranças adicionais no cartão por despesas incorridas'
    },
    
    signatureInfo: {
      date: 'Data da assinatura',
      time: 'Hora da assinatura',
      ip: 'IP do assinante',
      signature: 'ASSINATURA DIGITAL DO CLIENTE',
      verifiedSignature: 'Assinatura digital verificada e capturada no momento da assinatura do contrato'
    },
    
    footer: 'Este contrato foi gerado eletronicamente e é válido sem assinatura manuscrita.<br>Para qualquer dúvida, entre em contato conosco.',
    
    inspectionTitle: 'Inspeção de Entrega do Veículo',
    inspectionDate: 'Data',
    inspectionOdometer: 'Quilometragem',
    inspectionFuel: 'Combustível',
    inspectionCondition: 'Condição Geral',
    inspectionPhotos: 'Fotografias do Veículo',
    inspectionNotes: 'Observações',
    
    // Campos adicionais de inspeção
    front: 'Frontal',
    leftSide: 'Lado Esquerdo',
    rear: 'Traseira',
    rightSide: 'Lado Direito',
    odometer: 'Odômetro',
    bookingNumber: 'Nº Reserva',
    contractNumber: 'Nº Contrato',
    vehicleInformation: 'Informações do Veículo',
    customer: 'Cliente',
    inspectionData: 'Dados de Inspeção',
    fuelLevel: 'Nível de Combustível',
    inspector: 'Inspetor',
    generalCondition: 'Condição Geral',
    notes: 'Notas',
    photos: 'Fotos',
    
    // Campos adicionais do contrato
    contractTitle: 'Contrato de Aluguel de Veículos',
    contractDate: 'Data do Contrato',
    fullName: 'Nome Completo',
    dni: 'ID/Passaporte',
    rentalDetails: 'Detalhes do Aluguel',
    pickupDate: 'Data de Retirada',
    returnDate: 'Data de Devolução',
    pickupLocation: 'Local de Retirada',
    returnLocation: 'Local de Devolução',
    vehicles: 'Veículos',
    pricePerDay: 'Preço por Dia',
    model: 'Modelo',
    rentalPeriod: 'Período de Aluguel',
    termsAndConditions: 'Termos e Condições',
    terms: [
      'O locatário compromete-se a usar o veículo de forma responsável',
      'O veículo deve ser devolvido nas mesmas condições',
      'O locatário é responsável por quaisquer danos durante o período de aluguel'
    ],
    signatureTitle: 'Assinatura do Cliente'
  }
};

export function getTranslations(language: ContractLanguage = 'es'): ContractTranslations {
  return translations[language] || translations.es;
}
