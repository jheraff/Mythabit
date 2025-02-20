import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    boxContainer: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        width: 350,
        elevation: 5,
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
        marginTop: 40,
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#F67B7B",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#E0E0E0",
        paddingVertical: 5,
        borderRadius: 5,
        marginTop: 20,
    },
    iconStyle: {
        marginLeft: 8,
    },
    textInput: {
        color: "gray",
        marginVertical: 10,
        width: 300,
        fontSize: 17,
    },
    registerButton: {
        width: 200,
        backgroundColor: "#F67B7B",
        padding: 15,
        borderRadius: 6,
        marginLeft: "auto",
        marginRight: "auto",
        alignItems: 'center',
    },
    registerButtonText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 20,
        width: '100%',
    },
    circleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
    },
    socialIcon: {
        width: 30,
        height: 30,
    },
    footerView: {
        flex: 1,
        alignItems: "center",
        marginTop: 20
    },
    footerText: {
        fontSize: 16,
        color: '#2e2e2d'
    },
    footerLink: {
        color: "#788eec",
        fontWeight: "bold",
        fontSize: 16
    }
});