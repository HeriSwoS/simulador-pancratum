migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'herivelto.francatojr@gmail.com')
    } catch (_) {
      admin = new Record(users)
      admin.setEmail('herivelto.francatojr@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Herivelto')
      app.save(admin)
    }

    const cards = app.findCollectionByNameOrId('cards')
    const seeds = [
      ['Davi', 'guerreiro', 'rara', 8, 6, 'O pastor que venceu o gigante com uma funda e fé.'],
      [
        'Golias',
        'guerreiro',
        'epica',
        10,
        8,
        'O campeão de Gate que desafiou os exércitos de Israel.',
      ],
      [
        'Sansão',
        'guerreiro',
        'lendaria',
        12,
        4,
        'Sua força sobrenatural residia em seus cabelos consagrados.',
      ],
      [
        'Gideão',
        'guerreiro',
        'comum',
        6,
        7,
        'O trilhador que derrotou um exército com trezentos homens.',
      ],
      ['Josué', 'guerreiro', 'incomum', 7, 7, 'O sucessor de Moisés que fez o sol parar no céu.'],
      ['Moisés', 'guerreiro', 'rara', 5, 9, 'O libertador que partiu o mar em dois.'],
      ['Espada do Espírito', 'arma', 'rara', 3, 0, 'A palavra de Deus, afiada e viva.'],
      ['Funda de Davi', 'arma', 'comum', 2, 0, 'Cinco pedras lisas do ribeiro; bastou uma.'],
      ['Lança de Golias', 'arma', 'epica', 4, 0, 'Pesada como um feixe de tecelão.'],
      ['Escudo da Fé', 'armadura', 'comum', 0, 3, 'Apaga todas as setas flamejantes do maligno.'],
      ['Capacete da Salvação', 'armadura', 'comum', 0, 2, 'Protege a mente do guerreiro.'],
      [
        'Armadura Completa de Deus',
        'armadura',
        'lendaria',
        0,
        5,
        'Revesti-vos de toda a armadura de Deus.',
      ],
      ['Chuva de Pedras', 'evento', 'rara', 2, 0, 'Pedras caem do céu sobre os inimigos.'],
      ['Força Divina', 'evento', 'epica', 5, 0, 'O Espírito invade o guerreiro com poder.'],
      [
        'Arca da Aliança',
        'reliquia',
        'lendaria',
        0,
        4,
        'A presença de Deus no meio do acampamento.',
      ],
    ]

    const ids = []
    for (const seed of seeds) {
      let card
      try {
        card = app.findFirstRecordByData('cards', 'name', seed[0])
      } catch (_) {
        card = new Record(cards)
        card.set('owner', admin.id)
        card.set('name', seed[0])
        card.set('card_type', seed[1])
        card.set('rarity', seed[2])
        card.set('attack', seed[3])
        card.set('defense', seed[4])
        card.set('description', seed[5])
        card.set('image', '')
        card.set('is_public', true)
        app.save(card)
      }
      ids.push(card.id)
    }

    try {
      app.findFirstRecordByData('decks', 'name', 'Confronto dos Heróis')
    } catch (_) {
      const decks = app.findCollectionByNameOrId('decks')
      const deck = new Record(decks)
      const items = []
      for (let i = 0; i < ids.length; i += 1)
        items.push({ cardId: ids[i], quantity: i < 5 ? 4 : 3 })
      deck.set('owner', admin.id)
      deck.set('name', 'Confronto dos Heróis')
      deck.set('items', items)
      deck.set('main_character', ids[0])
      app.save(deck)
    }
  },
  (app) => {
    try {
      app.delete(app.findFirstRecordByData('decks', 'name', 'Confronto dos Heróis'))
    } catch (_) {}
    const names = [
      'Davi',
      'Golias',
      'Sansão',
      'Gideão',
      'Josué',
      'Moisés',
      'Espada do Espírito',
      'Funda de Davi',
      'Lança de Golias',
      'Escudo da Fé',
      'Capacete da Salvação',
      'Armadura Completa de Deus',
      'Chuva de Pedras',
      'Força Divina',
      'Arca da Aliança',
    ]
    for (const name of names) {
      try {
        const record = app.findFirstRecordByData('cards', 'name', name)
        if (record.getBool('is_public')) app.delete(record)
      } catch (_) {}
    }
  },
)
