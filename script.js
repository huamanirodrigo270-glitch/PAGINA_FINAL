// --- Elementos del DOM (Declaración Global) ---
const authModal = document.getElementById('auth-modal');
const adminPanel = document.getElementById('admin-panel');
const profileSection = document.getElementById('perfil-usuario');
const upcomingMatchesSection = document.getElementById('partidos');

// Elementos para Modales
const depositModal = document.getElementById('deposit-modal');
const withdrawModal = document.getElementById('withdraw-modal'); 
const betModal = document.getElementById('bet-modal');
const finishMatchModal = document.getElementById('finish-match-modal'); // NUEVO MODAL DE FINALIZACIÓN

// Variables para la sesión (serán asignadas en DOMContentLoaded)
let loginForm;
let registerForm;
let loginNavLi;
let profileNavButton;
let adminNavButton;
let logoutNavButton;


// --- BASE DE DATOS SIMULADA ---
const SIMULATED_ACCOUNTS = {
    'admin@copaperu.pe': { 
        password: 'admin123', 
        name: 'Dueño Administrador', 
        role: 'admin', 
        email: 'admin@copaperu.pe', 
        balance: 1000.00,
        history: [
            { date: '15/12 18:00', type: 'Depósito', desc: 'Transferencia Inicial', amount: 1000.00, balance: 1000.00, class: 'amount-deposit' }
        ],
        activeBets: [] 
    },
    'usuario@copaperu.pe': { 
        password: 'user123', 
        name: 'Usuario Apostador', 
        role: 'user', 
        email: 'usuario@copaperu.pe', 
        balance: 500.00,
        history: [
            { date: '15/12 18:00', type: 'Depósito', desc: 'Transferencia Inicial', amount: 500.00, balance: 500.00, class: 'amount-deposit' }
        ],
        activeBets: [] 
    }
};

let SIMULATED_MATCHES = [
    { id: 1, region: 'Cusco', date: 'SÁB. 16/12 - 15:30 HRS', team1: 'Deportivo Garcilaso', team2: 'ADT Tarma', odd1: 1.85, oddX: 3.20, odd2: 4.10, status: 'Activo' },
    { id: 2, region: 'Ica', date: 'DOM. 17/12 - 14:00 HRS', team1: 'Alianza Universidad', team2: 'Santos FC (Nasca)', odd1: 1.50, oddX: 3.75, odd2: 5.50, status: 'Activo' }
];

// Variable global para el usuario actual y la apuesta temporal
let currentUserName = null; 
let currentAccountEmail = null;
let currentBetSelection = {}; 

// --- Funciones de Utilidad y Modales ---

function getFormattedDate() {
    const now = new Date();
    const date = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

const successMessage = document.getElementById('success-message');
const successText = document.getElementById('success-text');

function showSuccessMessage(message) {
    successText.textContent = message;
    successMessage.style.display = 'flex';
}
function closeSuccessMessage() { successMessage.style.display = 'none'; }
window.closeSuccessMessage = closeSuccessMessage; 

function openAuthModal(mode = 'login') {
    if (authModal) {
        authModal.style.display = 'flex';
        document.getElementById('login-section').classList.toggle('active-form', mode === 'login');
        document.getElementById('register-section').classList.toggle('active-form', mode === 'register');
    }
}
function closeAuthModal() { if (authModal) authModal.style.display = 'none'; }
window.closeAuthModal = closeAuthModal; 
window.showLogin = () => { openAuthModal('login'); };
window.showRegister = () => { openAuthModal('register'); };


function openDepositModal() { if(depositModal) depositModal.style.display = 'flex'; }
function closeDepositModal() { if(depositModal) depositModal.style.display = 'none'; }
window.openDepositModal = openDepositModal;
window.closeDepositModal = closeDepositModal;

function openWithdrawModal() { 
    if (withdrawModal && currentAccountEmail) {
        const user = SIMULATED_ACCOUNTS[currentAccountEmail];
        document.getElementById('current-balance-display').textContent = `S/ ${user.balance.toFixed(2)}`;
        withdrawModal.style.display = 'flex'; 
    }
}
function closeWithdrawModal() { if(withdrawModal) withdrawModal.style.display = 'none'; }
window.openWithdrawModal = openWithdrawModal;
window.closeWithdrawModal = closeWithdrawModal;

function openBetModal() { if(betModal) betModal.style.display = 'flex'; }
function closeBetModal() { if(betModal) betModal.style.display = 'none'; }
window.closeBetModal = closeBetModal;

// Funciones de Control del Modal de Finalización (NUEVAS)
function openFinishModal(matchId) { 
    const match = SIMULATED_MATCHES.find(m => m.id === matchId);
    if (!match) return alert('Partido no encontrado.');

    if (finishMatchModal) finishMatchModal.style.display = 'flex';
    document.getElementById('finish-match-info').textContent = `Partido: ${match.team1} vs ${match.team2}`;
    document.getElementById('match-id-to-finish').value = matchId;
}
function closeFinishModal() { if(finishMatchModal) finishMatchModal.style.display = 'none'; }
window.openFinishModal = openFinishModal; 
window.closeFinishModal = closeFinishModal;


// --- GESTIÓN DE LA SESIÓN DE USUARIO Y PERFIL ---

function loadUserProfile(email) {
    const user = SIMULATED_ACCOUNTS[email];
    if (user && profileSection) {
        document.getElementById('profile-welcome').innerHTML = `👋 Hola, ${user.name}`;
        document.getElementById('user-balance').textContent = `S/ ${user.balance.toFixed(2)}`;
        profileSection.style.display = 'block';
        
        const transactionHistoryContainer = document.getElementById('transaction-history');
        const toggleHistoryBtn = document.getElementById('toggle-history-btn');
        if (transactionHistoryContainer) transactionHistoryContainer.style.display = 'none';
        if (toggleHistoryBtn) toggleHistoryBtn.textContent = 'Mostrar Historial de Transacciones';
    } else if (profileSection) {
        profileSection.style.display = 'none';
    }
}

function updateNavForLogin(name, email) {
    if (loginNavLi) loginNavLi.style.display = 'none';
    if (profileNavButton) profileNavButton.style.display = 'list-item';
    if (logoutNavButton) logoutNavButton.parentNode.style.display = 'list-item';
    
    currentUserName = name;
    currentAccountEmail = email; 

    const user = SIMULATED_ACCOUNTS[email];

    // Control de Visibilidad del Admin Panel
    if (user && user.role === 'admin' && adminNavButton) {
        adminNavButton.style.display = 'list-item';
        if(adminPanel) adminPanel.style.display = 'block';
        showAdminSection('match-management'); // Redirige al panel admin al iniciar sesión
    } else {
        if (adminNavButton) adminNavButton.style.display = 'none';
        if(adminPanel) adminPanel.style.display = 'none';
    }
    
    // Ocultar perfil si es admin (ya se muestra el panel)
    if (user.role === 'admin' && profileSection) {
        profileSection.style.display = 'none';
    } else {
        loadUserProfile(email);
    }
    
    // Redirección al perfil/admin
    window.location.hash = user.role === 'admin' ? 'admin-panel' : 'perfil-usuario'; 
}

function updateNavForLogout() {
    if (loginNavLi) loginNavLi.style.display = 'list-item';
    if (profileNavButton) profileNavButton.style.display = 'none';
    if (logoutNavButton) logoutNavButton.parentNode.style.display = 'none';
    if (adminNavButton) adminNavButton.style.display = 'none';
    
    if (profileSection) profileSection.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
    
    currentUserName = null;
    currentAccountEmail = null;
    
    // Renderiza los partidos después de cerrar sesión
    renderMatches(); 
    window.location.hash = 'inicio';
}

// --- LÓGICA DE HISTORIAL, APUESTAS Y ADMINISTRACIÓN ---

function recordTransaction(email, type, desc, amount, finalBalance, classType) {
    const user = SIMULATED_ACCOUNTS[email];
    if (user) {
        user.history.push({
            date: getFormattedDate(),
            type: type,
            desc: desc,
            amount: amount,
            balance: finalBalance,
            class: classType
        });
    }
}

function finishMatchAndSettleBets(matchId, finalResult) {
    const matchIndex = SIMULATED_MATCHES.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return alert('Error: Partido no existe en la base de datos.');

    const match = SIMULATED_MATCHES[matchIndex];
    match.status = `Finalizado (${finalResult})`;

    let totalLiquidaciones = 0;
    
    // 1. Recorrer todos los usuarios y sus apuestas
    Object.keys(SIMULATED_ACCOUNTS).forEach(email => {
        const user = SIMULATED_ACCOUNTS[email];
        
        // Filtrar y procesar las apuestas activas para este partido
        user.activeBets = user.activeBets.filter(bet => {
            if (bet.matchId === matchId) {
                // Verificar si la selección del usuario coincide con el resultado final
                if (bet.winnerKey === finalResult) {
                    const winAmount = bet.amount * bet.odd;
                    user.balance += winAmount;
                    totalLiquidaciones++;
                    
                    // Registrar la ganancia
                    recordTransaction(
                        email, 
                        'Premio', 
                        `Ganancia por acierto en ${bet.match} - Resultado: ${finalResult}`, 
                        winAmount, 
                        user.balance, 
                        'amount-deposit' // Usamos deposit para ganancia
                    );
                    return false; // Eliminar la apuesta de la lista activa
                } else {
                    // La apuesta se pierde, solo registrar el final
                    // El monto ya fue restado al apostar, aquí solo registramos el cierre de la apuesta
                    recordTransaction(
                        email, 
                        'Apuesta Perdida', 
                        `Pérdida en ${bet.match} - Resultado: ${finalResult}`, 
                        bet.amount, 
                        user.balance, 
                        'amount-withdraw' // Usamos withdraw/error para pérdida
                    );
                    return false; // Eliminar la apuesta de la lista activa
                }
            }
            return true; // Mantener otras apuestas activas
        });
    });

    closeFinishModal();
    renderMatches(); // Actualiza el estado del partido en la lista
    if (currentAccountEmail && SIMULATED_ACCOUNTS[currentAccountEmail].role === 'admin') {
        renderAdminMatches(); // Actualiza el panel admin
    }
    showSuccessMessage(`¡Liquidación Completa! Partido ${match.team1} vs ${match.team2} Finalizado con Resultado: ${finalResult}. ${totalLiquidaciones} apuestas liquidadas.`);
}
window.finishMatchAndSettleBets = finishMatchAndSettleBets;


function renderTransactionHistory(email) {
    const historyBody = document.getElementById('history-body');
    const noHistoryMessage = document.getElementById('no-history-message');
    if (!historyBody || !noHistoryMessage) return;

    historyBody.innerHTML = '';
    const user = SIMULATED_ACCOUNTS[email];

    if (!user || user.history.length === 0) {
        noHistoryMessage.style.display = 'block';
        return;
    }

    noHistoryMessage.style.display = 'none';
    
    user.history.slice().reverse().forEach(transaction => {
        const row = historyBody.insertRow();
        row.insertCell(0).textContent = transaction.date;
        row.insertCell(1).textContent = transaction.type;
        row.insertCell(2).textContent = transaction.desc;
        const amountCell = row.insertCell(3);
        
        let sign = '';
        if (transaction.type === 'Apuesta' || transaction.type === 'Retiro' || transaction.type === 'Apuesta Perdida') {
             sign = '-';
        } else if (transaction.type === 'Depósito' || transaction.type === 'Premio') {
             sign = '+';
        }

        amountCell.textContent = `${sign} S/ ${transaction.amount.toFixed(2)}`;
        amountCell.classList.add(transaction.class);
        row.insertCell(4).textContent = `S/ ${transaction.balance.toFixed(2)}`;
    });
}

function handleOddButtonClick() {
    if (!currentAccountEmail) {
        alert('Debes iniciar sesión para realizar una apuesta.');
        openAuthModal('login');
        return;
    }

    const button = this; 
    const oddText = button.textContent;
    const oddMatch = oddText.match(/\(([^)]+)\)/);
    const oddValue = oddMatch ? parseFloat(oddMatch[1]) : 0;
    const selectionName = oddText.split('(')[0].trim(); 

    const matchCard = button.closest('.match-card');
    const teamsText = matchCard.querySelector('.teams').textContent;
    const team1 = matchCard.querySelector('.teams span:first-child').textContent.trim();
    const team2 = matchCard.querySelector('.teams span:last-child').textContent.trim();
    const matchInfo = `${team1} vs ${team2}`;
    
    const match = SIMULATED_MATCHES.find(m => teamsText.includes(m.team1) && teamsText.includes(m.team2) && m.status === 'Activo');
    
    if (!match) {
         alert('Error: Partido no encontrado o ya finalizado.');
         return;
    }
    
    let winnerKey;
    if (selectionName.includes(team1)) winnerKey = '1';
    else if (selectionName.includes('Empate')) winnerKey = 'X';
    else if (selectionName.includes(team2)) winnerKey = '2';

    currentBetSelection = {
        match: matchInfo,
        matchId: match.id, 
        selection: selectionName,
        odd: oddValue,
        winnerKey: winnerKey, 
        email: currentAccountEmail
    };

    document.getElementById('bet-match-info').textContent = currentBetSelection.match;
    document.getElementById('bet-selection-info').textContent = 
        `Selección: ${currentBetSelection.selection} (Cuota: ${currentBetSelection.odd.toFixed(2)})`;
    document.getElementById('bet-amount').value = ''; 
    document.getElementById('potential-win-amount').textContent = 'S/ 0.00';

    openBetModal();
}

function renderMatches() {
    if (!upcomingMatchesSection) return;
    const matchList = upcomingMatchesSection.querySelector('.match-list');
    if (!matchList) return;
    matchList.innerHTML = '';
    
    SIMULATED_MATCHES.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        
        let oddButtonsHTML = '';
        let isClickable = match.status === 'Activo';

        if (isClickable) {
            oddButtonsHTML = `
                <button class="odd-button">Gana ${match.team1} (${match.odd1.toFixed(2)})</button>
                <button class="odd-button">Empate (${match.oddX.toFixed(2)})</button>
                <button class="odd-button">Gana ${match.team2} (${match.odd2.toFixed(2)})</button>
            `;
        } else {
             oddButtonsHTML = `
                <div class="odds" style="color: ${match.status.includes('Finalizado') ? '#aaa' : '#fff'};">
                    Estado: ${match.status}
                </div>
            `;
        }

        matchCard.innerHTML = `
            <p class="match-date">Región: ${match.region} | ${match.date}</p>
            <div class="teams">
                <span class="team-name">${match.team1}</span> 
                <span class="vs">vs</span> 
                <span class="team-name">${match.team2}</span>
            </div>
            <div class="odds">
                ${oddButtonsHTML}
            </div>
        `;
        matchList.appendChild(matchCard);
    });
    
    const oddButtons = document.querySelectorAll('.odd-button');
    oddButtons.forEach(button => button.removeEventListener('click', handleOddButtonClick));
    oddButtons.forEach(button => button.addEventListener('click', handleOddButtonClick));

    if (adminPanel && adminPanel.style.display === 'block') {
         renderAdminMatches();
    }
}

function renderAdminMatches() {
    const activeMatchesAdminList = document.getElementById('active-matches-admin');
    if (!activeMatchesAdminList) return;
    activeMatchesAdminList.innerHTML = '';

    SIMULATED_MATCHES.forEach(match => {
        const statusClass = match.status.includes('Activo') ? 'status-active' : 'status-finished';
        
        const matchCard = document.createElement('div');
        matchCard.className = 'admin-match-card';
        matchCard.innerHTML = `
            <div class="admin-match-info">
                <strong>${match.team1} vs ${match.team2}</strong>
                <span class="admin-match-date">(${match.region}) ${match.date} | <span class="${statusClass}">${match.status}</span></span>
                <div class="admin-match-odds">
                    L: ${match.odd1.toFixed(2)} | E: ${match.oddX.toFixed(2)} | V: ${match.odd2.toFixed(2)}
                </div>
            </div>
            <div class="admin-match-actions">
                ${match.status.includes('Activo') ? 
                    `<button class="update-btn" onclick="openFinishModal(${match.id})">Finalizar Partido</button>` : 
                    `<button class="delete-btn" disabled>Liquidado</button>`
                }
                <button class="delete-btn" onclick="deleteMatch(${match.id})">Eliminar (DB)</button>
            </div>
        `;
        activeMatchesAdminList.appendChild(matchCard);
    });
}
window.showAdminSection = (sectionId) => {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active-section'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active-section');
    document.querySelector(`.tab-btn[onclick*="${sectionId}"]`).classList.add('active');

    if (sectionId === 'user-reports') {
        renderUserReport();
    } else if (sectionId === 'match-management') {
        renderAdminMatches();
    }
};

function deleteMatch(matchId) {
    if (confirm('¿Estás seguro de que quieres eliminar este partido? Esta acción es irreversible.')) {
        SIMULATED_MATCHES = SIMULATED_MATCHES.filter(m => m.id !== matchId);
        renderMatches();
        renderAdminMatches();
        showSuccessMessage('Partido eliminado correctamente.');
    }
}
window.deleteMatch = deleteMatch; 

function renderUserReport() {
    const userReportBody = document.getElementById('user-report-body');
    const totalUsersDisplay = document.getElementById('total-users');
    if (!userReportBody || !totalUsersDisplay) return;
    userReportBody.innerHTML = '';
    
    const accounts = Object.values(SIMULATED_ACCOUNTS);
    
    accounts.forEach(user => {
        const row = userReportBody.insertRow();
        row.insertCell(0).textContent = user.name;
        row.insertCell(1).textContent = user.email || 'N/A'; 
        row.insertCell(2).textContent = `S/ ${user.balance.toFixed(2)}`;
        row.insertCell(3).textContent = user.role === 'admin' ? 'ADMIN' : 'Usuario';
    });

    totalUsersDisplay.textContent = accounts.length;
}


// --- Inicialización y Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Capturar referencias del DOM
    const loginNavButton = document.getElementById('login-btn');
    loginNavLi = loginNavButton ? loginNavButton.parentNode : null;
    profileNavButton = document.getElementById('profile-btn') ? document.getElementById('profile-btn').parentNode : null;
    adminNavButton = document.getElementById('admin-btn') ? document.getElementById('admin-btn').parentNode : null;
    logoutNavButton = document.getElementById('logout-btn');

    const registerButton = document.getElementById('register-button');
    const toggleHistoryBtn = document.getElementById('toggle-history-btn'); 
    const transactionHistoryContainer = document.getElementById('transaction-history');

    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    const depositForm = document.getElementById('deposit-form');
    const withdrawForm = document.getElementById('withdraw-form'); 
    const betForm = document.getElementById('bet-form');
    const addMatchForm = document.getElementById('add-match-form');
    const finishMatchForm = document.getElementById('finish-match-form'); // Capturar nuevo formulario


    // 2. Inicializar Navegación y Partidos
    updateNavForLogout();
    renderMatches();

    // 3. Añadir Event Listeners 
    
    // Botón de Login/Registrar (En el HTML ya tiene onclick="openAuthModal('login')")

    if (logoutNavButton) {
        logoutNavButton.addEventListener('click', (e) => {
            e.preventDefault();
            updateNavForLogout();
            showSuccessMessage('Has cerrado sesión exitosamente. ¡Vuelve pronto!');
        });
    }
    if (document.getElementById('profile-btn')) {
        document.getElementById('profile-btn').addEventListener('click', () => {
            if (currentAccountEmail) {
                loadUserProfile(currentAccountEmail);
                if(adminPanel) adminPanel.style.display = 'none';
            }
        });
    }
    if (document.getElementById('admin-btn')) {
        document.getElementById('admin-btn').addEventListener('click', () => {
            if(profileSection) profileSection.style.display = 'none';
            if(adminPanel) adminPanel.style.display = 'block';
            window.location.hash = 'admin-panel';
            showAdminSection('match-management'); 
        });
    }
    if (registerButton) {
        registerButton.addEventListener('click', () => openAuthModal('register'));
    }


    // Lógica de Historial
    if (toggleHistoryBtn) {
        toggleHistoryBtn.addEventListener('click', () => {
            const isVisible = transactionHistoryContainer.style.display === 'block';
            if (isVisible) {
                transactionHistoryContainer.style.display = 'none';
                toggleHistoryBtn.textContent = 'Mostrar Historial de Transacciones';
            } else {
                renderTransactionHistory(currentAccountEmail);
                transactionHistoryContainer.style.display = 'block';
                toggleHistoryBtn.textContent = 'Ocultar Historial de Transacciones';
            }
        });
    }


    // Lógica de Autenticación
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const account = SIMULATED_ACCOUNTS[email];
            if (account && account.password === password) {
                closeAuthModal();
                updateNavForLogin(account.name, email); 
                showSuccessMessage(`¡Bienvenido, ${account.name}! Has ingresado.`);
                loginForm.reset(); 
            } else {
                alert('Error: Credenciales incorrectas. Prueba con admin@copaperu.pe / admin123 o usuario@copaperu.pe / user123');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;

            if (password !== confirmPassword) { alert('Error de Registro: Las contraseñas no coinciden.'); return; }
            if (SIMULATED_ACCOUNTS[email]) { alert('Error de Registro: El correo electrónico ya está en uso.'); return; }
            
            SIMULATED_ACCOUNTS[email] = { 
                password: password, 
                name: name, 
                role: 'user', 
                email: email, 
                balance: 0.00, 
                history: [], 
                activeBets: [] 
            };
            
            closeAuthModal();
            updateNavForLogin(name, email);
            showSuccessMessage(`¡Registro de ${name} completado con éxito! Bienvenido a Copa Perú Bets.`);
            registerForm.reset();
        });
    }

    // Lógica de Transacciones
    if (depositForm) {
        depositForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('deposit-amount').value);
            const method = document.querySelector('input[name="deposit-method"]:checked').value;
            const user = SIMULATED_ACCOUNTS[currentAccountEmail];
            if (isNaN(amount) || amount <= 0) { alert('Por favor, ingresa un monto válido.'); return; }
            user.balance += amount;
            recordTransaction(currentAccountEmail, 'Depósito', `Vía ${method}`, amount, user.balance, 'amount-deposit');
            closeDepositModal();
            loadUserProfile(currentAccountEmail); 
            depositForm.reset();
            showSuccessMessage(`Depósito de S/ ${amount.toFixed(2)} exitoso. Saldo actualizado.`);
        });
    }

    if (withdrawForm) {
        withdrawForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('withdraw-amount').value);
            const user = SIMULATED_ACCOUNTS[currentAccountEmail];
            if (isNaN(amount) || amount <= 0 || amount > user.balance || amount < 10) { alert('Monto inválido o insuficiente. Mínimo S/ 10.00.'); return; }
            user.balance -= amount;
            recordTransaction(currentAccountEmail, 'Retiro', `Solicitud a cuenta bancaria`, amount, user.balance, 'amount-withdraw');
            closeWithdrawModal();
            loadUserProfile(currentAccountEmail); 
            withdrawForm.reset();
            showSuccessMessage(`Solicitud de Retiro de S/ ${amount.toFixed(2)} enviada.`);
        });
    }

    // Lógica de Apuestas
    if (betForm) {
        betForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('bet-amount').value);
            const user = SIMULATED_ACCOUNTS[currentAccountEmail];

            if (isNaN(amount) || amount <= 0) { alert('Monto inválido.'); return; }
            if (amount > user.balance) { alert('Saldo insuficiente.'); return; }

            user.balance -= amount;
            
            const desc = `Apuesta: ${currentBetSelection.match} (${currentBetSelection.selection}, Cuota: ${currentBetSelection.odd.toFixed(2)}) - Pendiente`;
            recordTransaction(currentAccountEmail, 'Apuesta', desc, amount, user.balance, 'amount-bet');

            user.activeBets.push({
                matchId: currentBetSelection.matchId,
                selection: currentBetSelection.selection,
                winnerKey: currentBetSelection.winnerKey,
                amount: amount,
                odd: currentBetSelection.odd,
                match: currentBetSelection.match,
                date: getFormattedDate()
            });

            closeBetModal();
            loadUserProfile(currentAccountEmail);

            const potentialWin = amount * currentBetSelection.odd;
            showSuccessMessage(`¡Apuesta de S/ ${amount.toFixed(2)} colocada! Ganancia Potencial: S/ ${potentialWin.toFixed(2)}. Esperando resultado.`);
        });
    }
    
    // Cálculo de Ganancia Potencial
    const betAmountInput = document.getElementById('bet-amount');
    if(betAmountInput){
        betAmountInput.addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value);
            const odd = currentBetSelection.odd || 0;
            const potentialWinAmount = document.getElementById('potential-win-amount');

            if (isNaN(amount) || amount <= 0 || odd === 0) {
                if(potentialWinAmount) potentialWinAmount.textContent = 'S/ 0.00';
                return;
            }
            const potentialWin = amount * odd;
            if(potentialWinAmount) potentialWinAmount.textContent = `S/ ${potentialWin.toFixed(2)}`;
        });
    }

    // Lógica de Administración (Añadir Partido)
    if (addMatchForm) {
        addMatchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const team1 = document.getElementById('new-match-team1').value;
            const team2 = document.getElementById('new-match-team2').value;
            const date = document.getElementById('new-match-date').value;
            const region = document.getElementById('new-match-region').value; 
            const odd1 = parseFloat(document.getElementById('new-odd-1').value);
            const oddX = parseFloat(document.getElementById('new-odd-X').value);
            const odd2 = parseFloat(document.getElementById('new-odd-2').value);

            if (isNaN(odd1) || isNaN(oddX) || isNaN(odd2) || odd1 <= 1 || oddX <= 1 || odd2 <= 1) {
                alert('Por favor, ingrese cuotas válidas (mayores a 1.00)');
                return;
            }

            const newMatch = {
                id: SIMULATED_MATCHES.length ? Math.max(...SIMULATED_MATCHES.map(m => m.id)) + 1 : 1,
                region: region, 
                date: date,
                team1: team1,
                team2: team2,
                odd1: odd1,
                oddX: oddX,
                odd2: odd2,
                status: 'Activo' 
            };

            SIMULATED_MATCHES.push(newMatch);
            renderMatches();
            addMatchForm.reset();
            showSuccessMessage(`Partido ${team1} vs ${team2} (${region}) añadido con éxito.`);
        });
    }
    
    // Lógica de Finalización de Partido (Admin) (NUEVA)
    if (finishMatchForm) {
        finishMatchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const matchId = parseInt(document.getElementById('match-id-to-finish').value);
            const finalResult = document.querySelector('input[name="final-result"]:checked').value;

            // Ejecutar la liquidación
            finishMatchAndSettleBets(matchId, finalResult);

            finishMatchForm.reset();
        });
    }

});