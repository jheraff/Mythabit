import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ActionScreen = () => {
    const navigation = useNavigation();
    const primaryColor = 'black';
    const secondaryColor = 'white';

    const routes = [
        { name: 'Adventure', route: 'Adventure' },
        { name: 'Items', route: 'Items' },
        { name: 'Shop', route: 'Shop' }
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Action</Text>
            <View style={styles.buttonContainer}>
                {routes.map((item) => (
                    <TouchableOpacity
                        key={item.route}
                        style={[
                            styles.button,
                            { backgroundColor: secondaryColor }
                        ]}
                        onPress={() => navigation.navigate(item.route)}
                    >
                        <Text
                            style={[
                                styles.buttonText,
                                { color: primaryColor }
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    buttonContainer: {
        width: '80%',
        alignItems: 'stretch',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: 'black',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
    }
});

export default ActionScreen;