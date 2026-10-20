"""
Osteoporosis Risk Prediction Interface
=====================================
Simple interface to demonstrate the trained model for risk prediction.
Suitable for academic presentations and clinical demonstrations.
"""

import joblib
import numpy as np
import pandas as pd
import os

class OsteoporosisRiskPredictor:
    """
    Production-ready osteoporosis risk prediction interface
    """
    
    def __init__(self, models_dir='../models'):
        self.models_dir = models_dir
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.metadata = None
        self.load_model_artifacts()
    
    def load_model_artifacts(self):
        """Load trained model and preprocessing artifacts"""
        try:
            # Load model artifacts
            model_path = os.path.join(self.models_dir, 'enhanced_osteoporosis_model.pkl')
            scaler_path = os.path.join(self.models_dir, 'enhanced_osteoporosis_scaler.pkl')
            features_path = os.path.join(self.models_dir, 'enhanced_osteoporosis_features.pkl')
            metadata_path = os.path.join(self.models_dir, 'enhanced_model_metadata.pkl')
            
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.feature_names = joblib.load(features_path)
            self.metadata = joblib.load(metadata_path)
            
            print("✅ Model artifacts loaded successfully")
            print(f"   Model type: {self.metadata['model_type']}")
            print(f"   Features: {len(self.feature_names)}")
            print(f"   Performance: Recall={self.metadata['performance']['recall']:.3f}")
            
        except Exception as e:
            print(f"❌ Error loading model artifacts: {e}")
            raise
    
    def create_feature_vector(self, patient_data):
        """
        Create feature vector from patient data
        
        Parameters:
        -----------
        patient_data : dict
            Dictionary containing patient information with keys:
            - age: int (18-100)
            - gender: str ('Male' or 'Female')
            - hormonal_changes: str ('Normal' or 'Postmenopausal')
            - family_history: str ('No' or 'Yes')
            - body_weight: str ('Normal' or 'Underweight')
            - calcium_intake: str ('Adequate' or 'Low')
            - vitamin_d_intake: str ('Sufficient' or 'Insufficient')
            - physical_activity: str ('Active' or 'Sedentary')
            - smoking: str ('No' or 'Yes')
            - alcohol_consumption: str ('None' or 'Moderate')
            - prior_fractures: str ('No' or 'Yes')
            - has_rheumatoid_arthritis: str ('No' or 'Yes')
            - has_hyperthyroidism: str ('No' or 'Yes')
            - takes_corticosteroids: str ('No' or 'Yes')
        """
        
        # Basic feature encoding
        features = {}
        
        # Age (numeric)
        features['Age'] = patient_data['age']
        
        # Binary encodings
        features['Gender'] = 1 if patient_data['gender'].lower() == 'female' else 0
        features['Hormonal Changes'] = 1 if patient_data.get('hormonal_changes', 'Normal').lower() == 'postmenopausal' else 0
        features['Family History'] = 1 if patient_data.get('family_history', 'No').lower() == 'yes' else 0
        features['Body Weight'] = 1 if patient_data.get('body_weight', 'Normal').lower() == 'underweight' else 0
        features['Calcium Intake'] = 1 if patient_data.get('calcium_intake', 'Adequate').lower() == 'low' else 0
        features['Vitamin D Intake'] = 1 if patient_data.get('vitamin_d_intake', 'Sufficient').lower() == 'insufficient' else 0
        features['Physical Activity'] = 1 if patient_data.get('physical_activity', 'Active').lower() == 'sedentary' else 0
        features['Smoking'] = 1 if patient_data.get('smoking', 'No').lower() == 'yes' else 0
        features['Alcohol Consumption'] = 1 if patient_data.get('alcohol_consumption', 'None').lower() == 'moderate' else 0
        features['Prior Fractures'] = 1 if patient_data.get('prior_fractures', 'No').lower() == 'yes' else 0
        features['Has_Rheumatoid_Arthritis'] = 1 if patient_data.get('has_rheumatoid_arthritis', 'No').lower() == 'yes' else 0
        features['Has_Hyperthyroidism'] = 1 if patient_data.get('has_hyperthyroidism', 'No').lower() == 'yes' else 0
        features['Takes_Corticosteroids'] = 1 if patient_data.get('takes_corticosteroids', 'No').lower() == 'yes' else 0
        
        # Advanced features (matching training pipeline)
        age = features['Age']
        features['Age_Group_Young'] = 1 if age < 40 else 0
        features['Age_Group_Middle'] = 1 if 40 <= age < 65 else 0
        features['Age_Group_Elderly'] = 1 if age >= 65 else 0
        
        # Interaction features
        features['Female_Postmenopausal'] = features['Gender'] * features['Hormonal Changes']
        features['Elderly_Female'] = features['Age_Group_Elderly'] * features['Gender']
        features['Underweight_Sedentary'] = features['Body Weight'] * features['Physical Activity']
        
        # Composite scores
        features['Nutritional_Risk'] = features['Calcium Intake'] + features['Vitamin D Intake']
        features['Medical_Complexity'] = (features['Has_Rheumatoid_Arthritis'] + 
                                        features['Has_Hyperthyroidism'] + 
                                        features['Takes_Corticosteroids'])
        features['Lifestyle_Risk'] = (features['Physical Activity'] + 
                                    features['Smoking'] + 
                                    features['Alcohol Consumption'])
        
        # Create feature vector in correct order
        feature_vector = [features.get(name, 0) for name in self.feature_names]
        
        return np.array(feature_vector).reshape(1, -1)
    
    def predict_risk(self, patient_data):
        """
        Predict osteoporosis risk for a patient
        
        Returns:
        --------
        dict with prediction results including probability, risk level, and recommendations
        """
        
        # Validate input
        self._validate_patient_data(patient_data)
        
        # Create feature vector
        features = self.create_feature_vector(patient_data)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Make prediction
        risk_probability = self.model.predict_proba(features_scaled)[0][1]
        risk_prediction = self.model.predict(features_scaled)[0]
        
        # Determine risk level and recommendations
        if risk_probability >= 0.7:
            risk_level = "HIGH RISK"
            recommendations = [
                "🚨 Immediate medical consultation recommended",
                "📋 DEXA bone density scan within 2 weeks",
                "💊 Discuss bisphosphonate therapy with doctor",
                "🥛 Increase calcium intake (1200mg/day)",
                "☀️ Ensure adequate vitamin D (800-1000 IU/day)",
                "🚶‍♀️ Start gentle weight-bearing exercise program",
                "🏠 Fall-proof home environment"
            ]
        elif risk_probability >= 0.3:
            risk_level = "MEDIUM RISK"
            recommendations = [
                "📅 Annual bone density monitoring",
                "👩‍⚕️ Discuss with healthcare provider",
                "🥛 Maintain adequate calcium (1000mg/day)",
                "☀️ Regular sunlight exposure for vitamin D",
                "🏃‍♀️ Regular weight-bearing exercise (30 min, 5x/week)",
                "🚭 Quit smoking if applicable",
                "🍷 Limit alcohol consumption"
            ]
        else:
            risk_level = "LOW RISK"
            recommendations = [
                "✅ Continue current healthy lifestyle",
                "🥛 Maintain calcium-rich diet",
                "🏃‍♀️ Stay physically active",
                "☀️ Get regular sunlight exposure",
                "📅 Routine screening as per age guidelines"
            ]
        
        # Identify key risk factors
        risk_factors = self._identify_risk_factors(patient_data)
        
        return {
            'risk_probability': round(risk_probability, 3),
            'risk_prediction': int(risk_prediction),
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'model_confidence': f"{max(self.model.predict_proba(features_scaled)[0]) * 100:.1f}%"
        }
    
    def _validate_patient_data(self, patient_data):
        """Validate patient data input"""
        required_fields = ['age', 'gender']
        
        for field in required_fields:
            if field not in patient_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Age validation
        age = patient_data['age']
        if not isinstance(age, (int, float)) or age < 18 or age > 100:
            raise ValueError("Age must be between 18 and 100")
        
        # Gender validation
        gender = patient_data['gender'].lower()
        if gender not in ['male', 'female']:
            raise ValueError("Gender must be 'Male' or 'Female'")
        
        # Medical validation: males cannot be postmenopausal
        if (gender == 'male' and 
            patient_data.get('hormonal_changes', '').lower() == 'postmenopausal'):
            raise ValueError("Males cannot have postmenopausal hormonal changes")
    
    def _identify_risk_factors(self, patient_data):
        """Identify present risk factors for explanation"""
        risk_factors = []
        
        age = patient_data['age']
        if age >= 65:
            risk_factors.append(f"Advanced age ({age} years) - bone density decreases significantly after 65")
        elif age >= 50:
            risk_factors.append(f"Age {age} - natural bone loss typically begins around 50")
        
        if patient_data['gender'].lower() == 'female':
            risk_factors.append("Female gender - women have higher osteoporosis risk")
            if patient_data.get('hormonal_changes', '').lower() == 'postmenopausal':
                risk_factors.append("Postmenopausal status - estrogen decline accelerates bone loss")
        
        if patient_data.get('family_history', '').lower() == 'yes':
            risk_factors.append("Family history - genetic predisposition to osteoporosis")
        
        if patient_data.get('body_weight', '').lower() == 'underweight':
            risk_factors.append("Underweight - reduced mechanical loading on bones")
        
        if patient_data.get('calcium_intake', '').lower() == 'low':
            risk_factors.append("Low calcium intake - insufficient mineral for bone health")
        
        if patient_data.get('vitamin_d_intake', '').lower() == 'insufficient':
            risk_factors.append("Insufficient vitamin D - impaired calcium absorption")
        
        if patient_data.get('physical_activity', '').lower() == 'sedentary':
            risk_factors.append("Sedentary lifestyle - lack of bone-stimulating exercise")
        
        if patient_data.get('smoking', '').lower() == 'yes':
            risk_factors.append("Smoking - reduces calcium absorption and bone formation")
        
        if patient_data.get('prior_fractures', '').lower() == 'yes':
            risk_factors.append("Prior fractures - strong predictor of future fracture risk")
        
        if patient_data.get('has_rheumatoid_arthritis', '').lower() == 'yes':
            risk_factors.append("Rheumatoid arthritis - chronic inflammation affects bone health")
        
        if patient_data.get('takes_corticosteroids', '').lower() == 'yes':
            risk_factors.append("Corticosteroid use - medications increase bone loss")
        
        if not risk_factors:
            risk_factors.append("No major risk factors identified - maintain healthy lifestyle")
        
        return risk_factors

# ============================================================================
# DEMONSTRATION EXAMPLES
# ============================================================================

def demo_predictions():
    """Demonstrate the model with example patients"""
    
    print("=" * 70)
    print("🏥 OSTEOPOROSIS RISK PREDICTION DEMONSTRATION")
    print("=" * 70)
    
    # Initialize predictor
    predictor = OsteoporosisRiskPredictor()
    
    # Example patients
    patients = [
        {
            'name': 'Sarah Johnson (High Risk)',
            'data': {
                'age': 72,
                'gender': 'Female',
                'hormonal_changes': 'Postmenopausal',
                'family_history': 'Yes',
                'body_weight': 'Underweight',
                'calcium_intake': 'Low',
                'vitamin_d_intake': 'Insufficient',
                'physical_activity': 'Sedentary',
                'smoking': 'Yes',
                'alcohol_consumption': 'Moderate',
                'prior_fractures': 'Yes',
                'has_rheumatoid_arthritis': 'Yes',
                'has_hyperthyroidism': 'No',
                'takes_corticosteroids': 'Yes'
            }
        },
        {
            'name': 'Michael Chen (Low Risk)',
            'data': {
                'age': 35,
                'gender': 'Male',
                'hormonal_changes': 'Normal',
                'family_history': 'No',
                'body_weight': 'Normal',
                'calcium_intake': 'Adequate',
                'vitamin_d_intake': 'Sufficient',
                'physical_activity': 'Active',
                'smoking': 'No',
                'alcohol_consumption': 'None',
                'prior_fractures': 'No',
                'has_rheumatoid_arthritis': 'No',
                'has_hyperthyroidism': 'No',
                'takes_corticosteroids': 'No'
            }
        },
        {
            'name': 'Linda Rodriguez (Medium Risk)',
            'data': {
                'age': 58,
                'gender': 'Female',
                'hormonal_changes': 'Postmenopausal',
                'family_history': 'Yes',
                'body_weight': 'Normal',
                'calcium_intake': 'Adequate',
                'vitamin_d_intake': 'Sufficient',
                'physical_activity': 'Sedentary',
                'smoking': 'No',
                'alcohol_consumption': 'None',
                'prior_fractures': 'No',
                'has_rheumatoid_arthritis': 'No',
                'has_hyperthyroidism': 'No',
                'takes_corticosteroids': 'No'
            }
        }
    ]
    
    # Make predictions for each patient
    for i, patient in enumerate(patients, 1):
        print(f"\n{'='*50}")
        print(f"👤 PATIENT {i}: {patient['name']}")
        print(f"{'='*50}")
        
        try:
            result = predictor.predict_risk(patient['data'])
            
            print(f"\n🎯 PREDICTION RESULTS:")
            print(f"   Risk Probability: {result['risk_probability']:.1%}")
            print(f"   Risk Level: {result['risk_level']}")
            print(f"   Model Confidence: {result['model_confidence']}")
            
            print(f"\n⚠️  IDENTIFIED RISK FACTORS:")
            for factor in result['risk_factors'][:5]:  # Show top 5
                print(f"   • {factor}")
            
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in result['recommendations'][:5]:  # Show top 5
                print(f"   {rec}")
                
        except Exception as e:
            print(f"❌ Error predicting for {patient['name']}: {e}")
    
    print(f"\n{'='*70}")
    print("✅ DEMONSTRATION COMPLETED")
    print("📊 Model ready for clinical integration!")
    print(f"{'='*70}")

if __name__ == "__main__":
    demo_predictions()