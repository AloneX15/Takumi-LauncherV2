/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
const { AZauth, Mojang } = require('minecraft-java-core');
const { ipcRenderer } = require('electron');

import { popup, database, changePanel, accountSelect, addAccount, config, setStatus } from '../utils.js';

class Login {
    static id = "login";
    async init(config) {
        this.config = config;
        this.db = new database();

        if (typeof this.config.online == 'boolean') {
            this.config.online ? this.getMicrosoft() : this.getCrack()
        } else if (typeof this.config.online == 'string') {
            if (this.config.online.match(/^(http|https):\/\/[^ "]+$/)) {
                this.getAZauth();
            }
        }
        
        document.querySelector('.cancel-home').addEventListener('click', () => {
            document.querySelector('.cancel-home').style.display = 'none'
            changePanel('settings')
        })
    }

    async getMicrosoft() {
        console.log('Initializing Microsoft login...');
        let popupLogin = new popup();
        let loginHome = document.querySelector('.login-home');
        let microsoftBtn = document.querySelector('.connect-home');
        loginHome.style.display = 'block';

        microsoftBtn.addEventListener("click", () => {
            popupLogin.openPopup({
                title: 'Conexión',
                content: 'Por favor, espere...',
                color: 'var(--color)'
            });

            ipcRenderer.invoke('Microsoft-window', this.config.client_id).then(async account_connect => {
                if (account_connect == 'cancel' || !account_connect) {
                    popupLogin.closePopup();
                    return;
                } else {
                    await this.saveData(account_connect)
                    popupLogin.closePopup();
                }

            }).catch(err => {
                popupLogin.openPopup({
                    title: 'Error',
                    content: err,
                    options: true
                });
            });
        })
    }

    async getCrack() {
    console.log('Initializing offline login...');
    let popupLogin = new popup();
    let loginOffline = document.querySelector('.login-offline');
    let emailOffline = document.querySelector('.email-offline');
    let passwordOffline = document.querySelector('.password-offline');
    let connectOffline = document.querySelector('.connect-offline');
    let registerOffline = document.querySelector('.register-offline');
    loginOffline.style.display = 'block';

    // LOGIN
    connectOffline.addEventListener('click', async () => {
        if (emailOffline.value.length < 3 || passwordOffline.value.length < 3) {
            popupLogin.openPopup({
                title: 'Error',
                content: 'Apodo y contraseña deben tener al menos 3 caracteres.',
                options: true
            });
            return;
        }

        // Llamada a la API de login
        try {
            const res = await fetch('https://TU_API/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: emailOffline.value, password: passwordOffline.value })
            });
            const data = await res.json();
            if (!data.success) {
                popupLogin.openPopup({
                    title: 'Error',
                    content: data.error || 'Usuario o contraseña incorrectos.',
                    options: true
                });
                return;
            }
            // Si login correcto, simula MojangConnect para el flujo existente
            let MojangConnect = { name: emailOffline.value, meta: { type: 'offline' } };
            await this.saveData(MojangConnect);
            popupLogin.closePopup();
        } catch (err) {
            popupLogin.openPopup({
                title: 'Error',
                content: 'No se pudo conectar con el servidor.',
                options: true
            });
        }
    });

    // REGISTRO
    registerOffline.addEventListener('click', async () => {
        if (emailOffline.value.length < 3 || passwordOffline.value.length < 3) {
            popupLogin.openPopup({
                title: 'Error',
                content: 'Apodo y contraseña deben tener al menos 3 caracteres.',
                options: true
            });
            return;
        }

        // Llamada a la API de registro
        try {
            const res = await fetch('https://TU_API/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: emailOffline.value, password: passwordOffline.value })
            });
            const data = await res.json();
            if (!data.success) {
                popupLogin.openPopup({
                    title: 'Error',
                    content: data.error || 'El apodo ya está registrado.',
                    options: true
                });
                return;
            }
            popupLogin.openPopup({
                title: 'Éxito',
                content: '¡Registro exitoso! Ahora puedes iniciar sesión.',
                options: true
            });
        } catch (err) {
            popupLogin.openPopup({
                title: 'Error',
                content: 'No se pudo conectar con el servidor.',
                options: true
            });
        }
    });
}

    async getAZauth() {
        console.log('Initializing AZauth login...');
        let AZauthClient = new AZauth(this.config.online);
        let PopupLogin = new popup();
        let loginAZauth = document.querySelector('.login-AZauth');
        let loginAZauthA2F = document.querySelector('.login-AZauth-A2F');

        let AZauthEmail = document.querySelector('.email-AZauth');
        let AZauthPassword = document.querySelector('.password-AZauth');
        let AZauthA2F = document.querySelector('.A2F-AZauth');
        let connectAZauthA2F = document.querySelector('.connect-AZauth-A2F');
        let AZauthConnectBTN = document.querySelector('.connect-AZauth');
        let AZauthCancelA2F = document.querySelector('.cancel-AZauth-A2F');

        loginAZauth.style.display = 'block';

        AZauthConnectBTN.addEventListener('click', async () => {
            PopupLogin.openPopup({
                title: 'Conexión en curso...',
                content: 'Por favor, espere...',
                color: 'var(--color)'
            });

            if (AZauthEmail.value == '' || AZauthPassword.value == '') {
                PopupLogin.openPopup({
                    title: 'Error',
                    content: 'Por favor, rellene todos los campos.',
                    options: true
                });
                return;
            }

            let AZauthConnect = await AZauthClient.login(AZauthEmail.value, AZauthPassword.value);

            if (AZauthConnect.error) {
                PopupLogin.openPopup({
                    title: 'Error',
                    content: AZauthConnect.message,
                    options: true
                });
                return;
            } else if (AZauthConnect.A2F) {
                loginAZauthA2F.style.display = 'block';
                loginAZauth.style.display = 'none';
                PopupLogin.closePopup();

                AZauthCancelA2F.addEventListener('click', () => {
                    loginAZauthA2F.style.display = 'none';
                    loginAZauth.style.display = 'block';
                });

                connectAZauthA2F.addEventListener('click', async () => {
                    PopupLogin.openPopup({
                        title: 'Conexión en curso...',
                        content: 'Por favor, espere...',
                        color: 'var(--color)'
                    });

                    if (AZauthA2F.value == '') {
                        PopupLogin.openPopup({
                            title: 'Error',
                            content: 'Por favor, introduzca el código 2FA.',
                            options: true
                        });
                        return;
                    }

                    AZauthConnect = await AZauthClient.login(AZauthEmail.value, AZauthPassword.value, AZauthA2F.value);

                    if (AZauthConnect.error) {
                        PopupLogin.openPopup({
                            title: 'Error',
                            content: AZauthConnect.message,
                            options: true
                        });
                        return;
                    }

                    await this.saveData(AZauthConnect)
                    PopupLogin.closePopup();
                });
            } else if (!AZauthConnect.A2F) {
                await this.saveData(AZauthConnect)
                PopupLogin.closePopup();
            }
        });
    }

    async saveData(connectionData) {
        let configClient = await this.db.readData('configClient');
        let account = await this.db.createData('accounts', connectionData)
        let instanceSelect = configClient.instance_selct
        let instancesList = await config.getInstanceList()
        configClient.account_selected = account.ID;

        for (let instance of instancesList) {
            if (instance.whitelistActive) {
                let whitelist = instance.whitelist.find(whitelist => whitelist == account.name)
                if (whitelist !== account.name) {
                    if (instance.name == instanceSelect) {
                        let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
                        configClient.instance_selct = newInstanceSelect.name
                        await setStatus(newInstanceSelect.status)
                    }
                }
            }
        }

        await this.db.updateData('configClient', configClient);
        await addAccount(account);
        await accountSelect(account);
        changePanel('home');
    }
}
export default Login;