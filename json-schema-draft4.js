var Model = require('./Model');
var Enum = require('./Enum');
var ArrayType = require('./Array');

//var primitives = require('./primitives');

var DEFAULT_TO_REF = function(Type) {
    if (!Type.typeName) {
        throw new Error('Cannot build ref to type that does not have "typeName"');
    }

    return Type.typeName;
};

var DEFAULT_IS_IGNORED_PROPERTY = function(name, property) {
    return false;
};

var SPECIAL_TYPES = {
    'object': {
        configureJsonSchemaProperty: function(jsonSchemaProperty) {
            jsonSchemaProperty.type = 'object';
        }
    },

    'boolean': {
        configureJsonSchemaProperty: function(jsonSchemaProperty) {
            jsonSchemaProperty.type = 'boolean';
        }
    },

    'date': {
        configureJsonSchemaProperty: function(jsonSchemaProperty) {
            jsonSchemaProperty.type = 'string';
            jsonSchemaProperty.format = 'date-time';
        }
    },

    'integer': {
        configureJsonSchemaProperty: function(jsonSchemaProperty) {
            jsonSchemaProperty.type = 'integer';
        }
    },

    'number': {
        configureJsonSchemaProperty: function(jsonSchemaProperty) {
            jsonSchemaProperty.type = 'number';
            jsonSchemaProperty.format = 'double';
        }
    },

    'string': {
        configureJsonSchemaProperty: function(jsonSchemaProperty) {
            jsonSchemaProperty.type = 'string';
        }
    }
};

function _configure(jsonSchemaProperty, Type, options) {
    var typeName = Type.typeName;
    var specialType;
    if (typeName && ((specialType = SPECIAL_TYPES[typeName]) !== undefined)) {
        specialType.configureJsonSchemaProperty(jsonSchemaProperty);
    } else {
        jsonSchemaProperty.$ref = options.toRef(Type);
    }
}

var IGNORED_PROPERTIES = {
    constructor: 1,
    $super: 1
};

exports.configureSchema = function(schema, Type, options) {
    options = options || {};
    options.toRef = options.toRef || DEFAULT_TO_REF;
    _configure(schema, Type, options);
};

exports.fromModel = function(Type, options) {
    options = options || {};

    options.toRef = options.toRef || DEFAULT_TO_REF;
    options.isIgnoredProperty = options.isIgnoredProperty || DEFAULT_IS_IGNORED_PROPERTY;

    var schema = {};

    if (Type.typeName) {
        schema.id = Type.typeName;
    }

    ['title', 'description', 'pattern'].forEach(function(attr) {
        var value = Type[attr];
        if (value !== undefined) {
            schema[attr] = value;
        }
    });

    var SuperType = Type.$super;
    if (SuperType && (SuperType !== Model) && !SuperType.isCompatibleWith(Enum)) {
        schema.allOf = [
            {
                $ref: options.toRef(SuperType)
            }
        ];
    }

    if (Type.isCompatibleWith(Enum)) {
        schema.type = 'string';
        schema.enum = Model.clean(Type.values);
    } else if (Type.hasProperties()) {
        schema.type = 'object';
        var properties = schema.properties = {};

        var declaredProperties = Type.Properties.prototype;
        for (var key in declaredProperties) {
            if (!IGNORED_PROPERTIES[key] && declaredProperties.hasOwnProperty(key)) {

                var declaredProperty = declaredProperties[key];

                if ((options.isIgnoredProperty(key, declaredProperty)) ||
                    (declaredProperty.getProperty() !== key)) {
                    // One of these conditions is true:
                    // - property is ignored
                    // - current key is an alias for another property
                    continue;
                }

                var jsonSchemaProperty = properties[key] = {};

                /*jshint loopfunc: true */
                ['title', 'description'].forEach(function(attr) {
                    var value = declaredProperty[attr];
                    if (value !== undefined) {
                        jsonSchemaProperty[attr] = value;
                    }
                });

                var PropertyType = declaredProperty.type;

                if (declaredProperty.type === ArrayType) {
                    jsonSchemaProperty.type = 'array';

                    var items = declaredProperty.items;
                    if (items) {
                        jsonSchemaProperty.items = {};
                        _configure(jsonSchemaProperty.items, items.type, options);
                    }
                } else {
                    _configure(jsonSchemaProperty, PropertyType, options);
                }
            }
        }
    } else if (Type.jsonSchemaType) {
        schema.type = Type.jsonSchemaType;
    } else {
        return null;
    }

    return schema;
};