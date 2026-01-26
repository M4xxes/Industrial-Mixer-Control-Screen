import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database.sqlite');
const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));
const get = promisify(db.get.bind(db));

async function fixMixerIds() {
  try {
    console.log('🔍 Vérification des IDs des malaxeurs...\n');
    
    // Afficher l'état actuel
    const currentMixers = await all('SELECT id, name FROM mixers ORDER BY id');
    console.log('État actuel de la base de données:');
    currentMixers.forEach(m => console.log(`  ID ${m.id}: ${m.name}`));
    console.log('');
    
    // Vérifier et corriger B5 (doit avoir l'ID 5, pas 4)
    const b5 = await get('SELECT id, name FROM mixers WHERE name LIKE "%B5%"');
    if (b5 && b5.id !== 5) {
      console.log(`⚠️  Correction: ${b5.name} a l'ID ${b5.id}, devrait être 5`);
      // Vérifier si l'ID 5 existe déjà
      const id5Exists = await get('SELECT id FROM mixers WHERE id = 5');
      if (id5Exists) {
        console.log('   ⚠️  L\'ID 5 existe déjà, suppression de l\'ancien enregistrement...');
        await run('DELETE FROM mixers WHERE id = 5');
      }
      await run('UPDATE mixers SET id = 5 WHERE id = ? AND name LIKE "%B5%"', [b5.id]);
      console.log('   ✅ Corrigé');
    } else if (b5) {
      console.log(`✅ ${b5.name} a déjà le bon ID (${b5.id})`);
    } else {
      console.log('⚠️  Malaxeur B5 non trouvé dans la base de données');
    }
    
    // Vérifier et corriger B6 (doit avoir l'ID 6, pas 5)
    const b6 = await get('SELECT id, name FROM mixers WHERE name LIKE "%B6%"');
    if (b6 && b6.id !== 6) {
      console.log(`⚠️  Correction: ${b6.name} a l'ID ${b6.id}, devrait être 6`);
      const id6Exists = await get('SELECT id FROM mixers WHERE id = 6');
      if (id6Exists) {
        console.log('   ⚠️  L\'ID 6 existe déjà, suppression de l\'ancien enregistrement...');
        await run('DELETE FROM mixers WHERE id = 6');
      }
      await run('UPDATE mixers SET id = 6 WHERE id = ? AND name LIKE "%B6%"', [b6.id]);
      console.log('   ✅ Corrigé');
    } else if (b6) {
      console.log(`✅ ${b6.name} a déjà le bon ID (${b6.id})`);
    } else {
      console.log('⚠️  Malaxeur B6 non trouvé dans la base de données');
    }
    
    // Vérifier et corriger B7 (doit avoir l'ID 7, pas 6)
    const b7 = await get('SELECT id, name FROM mixers WHERE name LIKE "%B7%"');
    if (b7 && b7.id !== 7) {
      console.log(`⚠️  Correction: ${b7.name} a l'ID ${b7.id}, devrait être 7`);
      const id7Exists = await get('SELECT id FROM mixers WHERE id = 7');
      if (id7Exists) {
        console.log('   ⚠️  L\'ID 7 existe déjà, suppression de l\'ancien enregistrement...');
        await run('DELETE FROM mixers WHERE id = 7');
      }
      await run('UPDATE mixers SET id = 7 WHERE id = ? AND name LIKE "%B7%"', [b7.id]);
      console.log('   ✅ Corrigé');
    } else if (b7) {
      console.log(`✅ ${b7.name} a déjà le bon ID (${b7.id})`);
    } else {
      console.log('⚠️  Malaxeur B7 non trouvé dans la base de données');
    }
    
    // Vérifier que B3 existe avec l'ID 3
    const b3 = await get('SELECT id, name FROM mixers WHERE id = 3 OR name LIKE "%B3%"');
    if (!b3) {
      console.log('\n⚠️  Malaxeur B3 non trouvé ! Création...');
      await run(`
        INSERT INTO mixers (id, name, status, temperature, pressure, speed, power, motor_arm, motor_screw)
        VALUES (3, 'Malaxeur B3', 'Arrêt', 25.0, 0, 0, 0, 'Arrêt', 'Arrêt')
      `);
      console.log('   ✅ Malaxeur B3 créé avec l\'ID 3');
    } else if (b3.id !== 3) {
      console.log(`\n⚠️  Correction: ${b3.name} a l'ID ${b3.id}, devrait être 3`);
      const id3Exists = await get('SELECT id FROM mixers WHERE id = 3');
      if (id3Exists && id3Exists.id !== b3.id) {
        console.log('   ⚠️  L\'ID 3 existe déjà, suppression de l\'ancien enregistrement...');
        await run('DELETE FROM mixers WHERE id = 3');
      }
      await run('UPDATE mixers SET id = 3 WHERE id = ? AND name LIKE "%B3%"', [b3.id]);
      console.log('   ✅ Corrigé');
    } else {
      console.log(`\n✅ ${b3.name} existe avec le bon ID (${b3.id})`);
    }
    
    // Afficher l'état final
    console.log('\n📊 État final de la base de données:');
    const finalMixers = await all('SELECT id, name FROM mixers ORDER BY id');
    finalMixers.forEach(m => console.log(`  ID ${m.id}: ${m.name}`));
    
    // Vérifier que tous les malaxeurs nécessaires existent
    const requiredIds = [1, 2, 3, 5, 6, 7];
    const existingIds = finalMixers.map(m => m.id);
    const missingIds = requiredIds.filter(id => !existingIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log(`\n⚠️  Malaxeurs manquants (IDs): ${missingIds.join(', ')}`);
      console.log('   Exécutez: npm run init-db pour initialiser la base de données');
    } else {
      console.log('\n✅ Tous les malaxeurs nécessaires sont présents !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    db.close();
  }
}

fixMixerIds();
