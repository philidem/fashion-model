const test = require('ava');

const Model = require('../Model');
const IntegerType = require('../Integer');
const ObservableModel = require('../ObservableModel');

test('should support init method of normal Model which will be called during construction', function (t) {
  const Person = Model.extend({
    init: function (data, options) {
      const name = this.getName();
      const age = this.getAge();

      if (name === undefined) {
        this.setName('Anonymous');
      }

      if (age === undefined) {
        this.setAge(-1);
      }

      t.true(!!Model.isModel(this.constructor));
    },

    properties: {
      name: String,
      age: IntegerType
    }
  });

  const person = new Person();
  t.is(person.getName(), 'Anonymous');
  t.is(person.getAge(), -1);

  const person2 = new Person({
    name: 'John',
    age: 30
  });

  t.is(person2.getName(), 'John');
  t.is(person2.getAge(), 30);
});

test('should support init method of ObservableModel which will be called during construction', function (t) {
  const Person = ObservableModel.extend({
    init: function (data, options) {
      const name = this.getName();
      const age = this.getAge();

      if (name === undefined) {
        this.setName('Anonymous');
      }

      if (age === undefined) {
        this.setAge(-1);
      }

      t.true(!!Model.isModel(this.constructor));
    },

    properties: {
      name: String,
      age: IntegerType
    }
  });

  const person = new Person();
  t.is(person.getName(), 'Anonymous');
  t.is(person.getAge(), -1);

  const person2 = new Person({
    name: 'John',
    age: 30
  });

  t.is(person2.getName(), 'John');
  t.is(person2.getAge(), 30);
});

test('should call init method in super types starting from the base class', function (t) {
  const Animal = Model.extend({
    init: function () {
      t.is(this._isAnimal, undefined);
      t.is(this._isDog, undefined);
      t.is(this._isPoodle, undefined);
      this._isAnimal = true;
    }
  });

  const Dog = Animal.extend({
    init: function () {
      t.true(this._isAnimal);
      t.is(this._isDog, undefined);
      t.is(this._isPoodle, undefined);
      this._isDog = true;
    }
  });

  const Poodle = Dog.extend({
    init: function () {
      t.true(this._isAnimal);
      t.true(this._isDog);
      t.is(this._isPoodle, undefined);
      this._isPoodle = true;
    }
  });

  const poodle = new Poodle();
  t.true(poodle._isAnimal);
  t.true(poodle._isDog);
  t.true(poodle._isPoodle);
});
