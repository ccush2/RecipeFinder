import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import axios from 'axios';

const API_KEY = '1';
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

interface Recipe {
  idMeal: string;
  strMeal: string;
}

interface RecipeDetails {
  idMeal: string;
  strMeal: string;
  strInstructions: string;
  [key: string]: string | null;
}

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<string>('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const searchRecipes = async () => {
    setLoading(true);
    const ingredientList = ingredients.split(',').map(item => item.trim());
    let allRecipes: Recipe[] = [];

    try {
      for (const ingredient of ingredientList) {
        const response = await axios.get<{meals: Recipe[]}>(
          `${BASE_URL}/filter.php?i=${ingredient}`,
        );
        if (response.data.meals) {
          allRecipes =
            allRecipes.length === 0
              ? response.data.meals
              : allRecipes.filter(recipe =>
                  response.data.meals.some(
                    newRecipe => newRecipe.idMeal === recipe.idMeal,
                  ),
                );
        }
        if (allRecipes.length === 0) break;
      }
      setRecipes(allRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeDetails = async (id: string) => {
    try {
      const response = await axios.get<{meals: RecipeDetails[]}>(
        `${BASE_URL}/lookup.php?i=${id}`,
      );
      if (response.data.meals && response.data.meals.length > 0) {
        setSelectedRecipe(response.data.meals[0]);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    }
  };

  const renderIngredients = () => {
    if (!selectedRecipe) return null;
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient =
        selectedRecipe[`strIngredient${i}` as keyof RecipeDetails];
      const measure = selectedRecipe[`strMeasure${i}` as keyof RecipeDetails];
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push(`${measure} ${ingredient}`);
      }
    }
    return ingredients.map((item, index) => (
      <Text key={index} style={styles.ingredientText}>
        {item}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe Finder</Text>
      <TextInput
        style={styles.input}
        value={ingredients}
        onChangeText={setIngredients}
        placeholder="Enter ingredients (comma-separated)"
      />
      <Button
        title="Search Recipes"
        onPress={searchRecipes}
        disabled={loading}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => item.idMeal}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.recipeItem}
              onPress={() => getRecipeDetails(item.idMeal)}>
              <Text>{item.strMeal}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.noResults}>
              No recipes found. Try different ingredients.
            </Text>
          }
        />
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalView}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              <Text style={styles.modalTitle}>{selectedRecipe?.strMeal}</Text>
              <Text style={styles.sectionTitle}>Ingredients:</Text>
              {renderIngredients()}
              <Text style={styles.sectionTitle}>Instructions:</Text>
              <Text style={styles.instructionsText}>
                {selectedRecipe?.strInstructions}
              </Text>
            </ScrollView>
            <View style={styles.closeButtonContainer}>
              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  recipeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  ingredientText: {
    fontSize: 16,
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 16,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  closeButtonContainer: {
    marginTop: 10,
  },
});

export default App;
