import { Unauthenticated } from './unauthenticated';
import { Authenticated } from './authenticated';
import { AuthState } from './authState';
import '../app.css';

export function Login({ userName, authState, onAuthChange }) {
  return (
    <div>
      <main>
        <form onSubmit={(e) => e.preventDefault()}>
            {authState !== AuthState.Unknown && <h1>Welcome to Polyrhythmd</h1>}
            {authState === AuthState.Authenticated && (
            <Authenticated userName={userName} onLogout={() => onAuthChange(userName, AuthState.Unauthenticated)} />
            )}
            {authState === AuthState.Unauthenticated && (
            <Unauthenticated
                userName={userName}
                onLogin={(loginUserName) => {
                onAuthChange(loginUserName, AuthState.Authenticated);
                }}
            />
            )}
        </form>
      </main>
    </div>
  );
}