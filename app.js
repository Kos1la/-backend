
import axios from "axios";
import pkg from 'pg'
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg

// Подключение к базе данных
const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/kos1la"
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS Kos1la (
    id INT PRIMARY KEY,
    name TEXT,
    data JSONB
  );
`;

async function fetchAndStoreCharacters() {
    try {
        await client.connect(); // Устанавливаем соединение с базой данных
        await client.query(createTableQuery); // Создаем таблицу, если она не существует

        // Запрашиваем данные с внешнего API (Rick and Morty)
        const response = await axios.get('https://rickandmortyapi.com/api/character');
        const characters = response.data.results; // Получаем массив персонажей

        // Запрос для вставки данных в таблицу
        const queryText = 'INSERT INTO Kos1la (id, name, data) VALUES($1, $2, $3) ON CONFLICT (id) DO NOTHING';

        // Создаем массив  для выполнения запросов на вставку данных
        const promises = characters.map(character => {
            const { id, name, status, species, gender, origin, location, image } = character;
            const data = { id, name, status, species, gender, origin: origin.name, location: location.name, image };
            return client.query(queryText, [id, name, data]);
        });

        // Ожидаем завершения всех запросов
        await Promise.all(promises);

        console.log('Данные успешно загружены в базу данных');
    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await client.end(); // Закрываем соединение с базой данных
    }
}

fetchAndStoreCharacters();

