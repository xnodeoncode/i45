import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { DataContext, DatabaseSettings, PersistenceTypes } from 'i45'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  var settings = new DatabaseSettings("myDatabase", 1, "myDatabaseTable", "id", PersistenceTypes.LocalStorage);

  var dataContext = new DataContext(settings.persistenceType, settings.databaseName, settings.databaseVersion, settings.objectStoreName, settings.keyPathField);
  var book = {"title":"myBook", "author":"myAuthor", "id":123456};
  var bookTwo = {"title":"myBookTwo", "author":"myAuthor, Jr.", "id":123457};

  var books = [];
  books.push(book);
books.push(bookTwo);  
  dataContext.persist(settings, books);
  
  console.log(dataContext.retrieve(settings));
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
